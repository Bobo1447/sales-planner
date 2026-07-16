const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const { generateSeedData } = require('./seed-data');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// ============ 双模式数据存储 ============
// 有 MONGODB_URI → MongoDB持久化存储
// 无 MONGODB_URI → 内存存储（实时同步仍可用，重启后数据从种子重新加载）

let mongoose, Task;
let useMongoDB = false;

// 内存存储（无数据库时的备用方案）
let memoryTasks = [];
let memoryInitialized = false;

// ============ 认证系统 ============
const USERS = {
  '管理员': { password: 'admin2026', role: 'admin' },
  '陆华':   { password: 'luhua2026', role: 'sales', name: '陆华' },
  '过健':   { password: 'guojian2026', role: 'sales', name: '过健' },
  '刘童':   { password: 'liutong2026', role: 'sales', name: '刘童' },
  '杨景妮': { password: 'nina2026',   role: 'sales', name: '杨景妮' },
  '薛琳':   { password: 'shelly2026', role: 'sales', name: '薛琳' },
};

// ============ 数据库初始化 ============
async function initDatabase() {
  if (MONGODB_URI) {
    try {
      mongoose = require('mongoose');

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

      Task = mongoose.model('Task', taskSchema);

      await mongoose.connect(MONGODB_URI);
      console.log('✅ MongoDB 连接成功');

      const count = await Task.countDocuments();
      if (count === 0) {
        console.log('首次启动，插入种子数据...');
        const seedData = generateSeedData();
        await Task.insertMany(seedData.tasks);
        console.log(`种子数据插入完成，共 ${seedData.tasks.length} 条任务`);
      } else {
        console.log(`数据库已有 ${count} 条任务，跳过种子数据`);
      }

      useMongoDB = true;
      console.log('✅ MongoDB 模式启动');
    } catch (err) {
      console.error('❌ MongoDB 连接失败:', err.message);
      console.log('⚠️ 切换到内存存储模式...');
      useMongoDB = false;
      initMemoryStore();
    }
  } else {
    console.log('⚠️ 未配置 MONGODB_URI，使用内存存储模式');
    console.log('💡 实时同步仍可用，但服务器重启后数据会恢复为种子数据');
    console.log('💡 如需持久化，请设置 MONGODB_URI 环境变量（MongoDB Atlas 连接字符串）');
    initMemoryStore();
  }
}

function initMemoryStore() {
  const seedData = generateSeedData();
  memoryTasks = [...seedData.tasks];
  memoryInitialized = true;
  console.log(`✅ 内存存储初始化完成，共 ${memoryTasks.length} 条种子任务`);
}

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
    if (useMongoDB) {
      const tasks = await Task.find().sort({ createdAt: 1 }).lean();
      res.json({ success: true, data: { tasks } });
    } else {
      res.json({ success: true, data: { tasks: memoryTasks } });
    }
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

    const newTask = { ...task, id, createdAt: now, updatedAt: now };

    if (useMongoDB) {
      const savedTask = await new Task(newTask).save();
      const taskObj = savedTask.toObject();
      io.emit('task_created', taskObj);
      res.json({ success: true, task: taskObj });
    } else {
      memoryTasks.push(newTask);
      io.emit('task_created', newTask);
      res.json({ success: true, task: newTask });
    }
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

    if (useMongoDB) {
      const updatedTask = await Task.findOneAndUpdate(
        { id: taskId }, updates,
        { new: true, runValidators: true }
      ).lean();

      if (!updatedTask) {
        return res.json({ success: false, message: '任务不存在' });
      }

      io.emit('task_updated', updatedTask);
      res.json({ success: true, task: updatedTask });
    } else {
      const idx = memoryTasks.findIndex(t => t.id === taskId);
      if (idx === -1) {
        return res.json({ success: false, message: '任务不存在' });
      }

      memoryTasks[idx] = { ...memoryTasks[idx], ...updates };
      io.emit('task_updated', memoryTasks[idx]);
      res.json({ success: true, task: memoryTasks[idx] });
    }
  } catch (err) {
    console.error('更新任务失败:', err.message);
    res.json({ success: false, message: '更新任务失败' });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    if (useMongoDB) {
      const deleted = await Task.findOneAndDelete({ id: taskId }).lean();
      if (!deleted) {
        return res.json({ success: false, message: '任务不存在' });
      }
      io.emit('task_deleted', { id: taskId });
      res.json({ success: true });
    } else {
      const idx = memoryTasks.findIndex(t => t.id === taskId);
      if (idx === -1) {
        return res.json({ success: false, message: '任务不存在' });
      }
      memoryTasks.splice(idx, 1);
      io.emit('task_deleted', { id: taskId });
      res.json({ success: true });
    }
  } catch (err) {
    console.error('删除任务失败:', err.message);
    res.json({ success: false, message: '删除任务失败' });
  }
});

// 同步状态
app.get('/api/sync-status', (req, res) => {
  res.json({
    mode: useMongoDB ? 'mongodb' : 'memory',
    persistent: useMongoDB,
    taskCount: useMongoDB ? 'check_db' : memoryTasks.length,
    message: useMongoDB
      ? '数据持久化到 MongoDB，重启不丢失'
      : '内存存储模式，实时同步可用，重启后恢复为种子数据'
  });
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
      if (useMongoDB) {
        const tasks = await Task.find().sort({ createdAt: 1 }).lean();
        socket.emit('full_sync', { tasks });
      } else {
        socket.emit('full_sync', { tasks: memoryTasks });
      }
    } catch (err) {
      console.error('全量同步失败:', err.message);
    }
  });
});

// ============ 启动服务 ============
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 销售工作计划拆解器服务已启动，端口: ${PORT}`);
    console.log(`📦 存储模式: ${useMongoDB ? 'MongoDB持久化' : '内存存储（实时同步可用）'}`);
  });
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('服务正在关闭...');
  if (useMongoDB && mongoose) {
    await mongoose.connection.close();
  }
  server.close();
  process.exit(0);
});
