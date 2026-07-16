const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { generateSeedData } = require('./seed-data');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-planner';

// ============ MongoDB 数据模型 ============
const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  level: { type: String, required: true },
  period: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  targetAmount: { type: Number, default: 0 },
  client: { type: String, default: '' },
  action: { type: String, default: '' },
  expectedResult: { type: String, default: '' },
  risk: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  priority: { type: String, default: '核心' },
  date: { type: String, default: '' },
  week: { type: Number, default: 0 },
  createdAt: { type: String, default: '' },
  updatedAt: { type: String, default: '' }
}, { collection: 'tasks', versionKey: false });

const Task = mongoose.model('Task', taskSchema);

// ============ 连接数据库并初始化种子数据 ============
async function initDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 连接成功');

    // 检查是否已有数据
    const count = await Task.countDocuments();

    if (count === 0) {
      console.log('首次启动，正在插入种子数据...');
      const seedData = generateSeedData();
      const tasks = seedData.tasks;

      await Task.insertMany(tasks);
      console.log(`种子数据插入完成，共 ${tasks.length} 条任务`);
    } else {
      console.log(`数据库已有 ${count} 条任务，跳过种子数据`);
    }

    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err.message);
    // 等待5秒重试
    console.log('5秒后重试连接...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('重试连接成功');
    } catch (retryErr) {
      console.error('重试连接失败:', retryErr.message);
      process.exit(1);
    }
  }
}

// ============ 认证系统 ============
const USERS = {
  '管理员': { password: 'admin2026', role: 'admin' },
  '陆华':   { password: 'luhua2026', role: 'sales', name: '陆华' },
  '过健':   { password: 'guojian2026', role: 'sales', name: '过健' },
  '刘童':   { password: 'liutong2026', role: 'sales', name: '刘童' },
  '杨景妮': { password: 'nina2026',   role: 'sales', name: '杨景妮' },
  '薛琳':   { password: 'shelly2026', role: 'sales', name: '薛琳' },
};

// ============ 中间件 ============
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ API ============
// 登录
app.post('/api/login', (req, res) => {
  const { identity, password } = req.body;
  const user = USERS[identity];
  if (!user || user.password !== password) {
    return res.json({ success: false, message: '密码错误或身份不存在' });
  }
  const token = crypto.randomBytes(16).toString('hex');
  const userInfo = {
    token,
    identity,
    role: user.role,
    name: user.name || identity,
  };
  res.json({ success: true, user: userInfo });
});

// 获取所有数据
app.get('/api/data', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: { tasks } });
  } catch (err) {
    console.error('获取数据失败:', err.message);
    res.json({ success: false, message: '数据加载失败' });
  }
});

// 创建任务
app.post('/api/tasks', async (req, res) => {
  try {
    const task = req.body;
    const id = 'task_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const now = new Date().toISOString();

    const newTask = new Task({
      ...task,
      id,
      createdAt: now,
      updatedAt: now
    });

    await newTask.save();

    const savedTask = newTask.toObject();
    io.emit('task_created', savedTask);
    res.json({ success: true, task: savedTask });
  } catch (err) {
    console.error('创建任务失败:', err.message);
    res.json({ success: false, message: '创建任务失败' });
  }
});

// 更新任务
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    const now = new Date().toISOString();

    updates.updatedAt = now;

    const updatedTask = await Task.findOneAndUpdate(
      { id: taskId },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedTask) {
      return res.json({ success: false, message: '任务不存在' });
    }

    io.emit('task_updated', updatedTask);
    res.json({ success: true, task: updatedTask });
  } catch (err) {
    console.error('更新任务失败:', err.message);
    res.json({ success: false, message: '更新任务失败' });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const deleted = await Task.findOneAndDelete({ id: taskId }).lean();

    if (!deleted) {
      return res.json({ success: false, message: '任务不存在' });
    }

    io.emit('task_deleted', { id: taskId });
    res.json({ success: true });
  } catch (err) {
    console.error('删除任务失败:', err.message);
    res.json({ success: false, message: '删除任务失败' });
  }
});

// ============ WebSocket 实时同步 ============
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });

  // 客户端请求全量同步
  socket.on('request_sync', async () => {
    try {
      const tasks = await Task.find().sort({ createdAt: 1 }).lean();
      socket.emit('full_sync', { tasks });
    } catch (err) {
      console.error('全量同步失败:', err.message);
    }
  });
});

// ============ 启动服务 ============
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`销售工作计划拆解器服务已启动，端口: ${PORT}`);
  });
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('服务正在关闭...');
  await mongoose.connection.close();
  server.close();
  process.exit(0);
});
