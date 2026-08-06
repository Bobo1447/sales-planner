const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const { generateSeedData, USERS } = require('./seed-data');
const { generateAugustSeedData } = require('./seed-data-august');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// ============ GitHub 仓库持久化 ============
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'Bobo1447/sales-planner';
const GITHUB_DATA_PATH = process.env.GITHUB_DATA_PATH || 'server-data.json';
const GITHUB_API = 'https://api.github.com';

let useMongoDB = false;
let useGitHub = false;
let mongoose, Task;
let lastInitError = null;

// 内存数据（所有模式共用）
let memoryTasks = [];
let memoryInitialized = false;

// 8月数据存储（独立于7月）
let augustMemoryTasks = [];
let augustMemoryInitialized = false;
let augustGithubDataSha = null;
let augustSaveTimer = null;
let augustHasUnsavedChanges = false;
const GITHUB_AUGUST_DATA_PATH = 'server-data-august.json';

// GitHub 持久化状态
let githubDataSha = null;
let saveTimer = null;
let hasUnsavedChanges = false;

// ============ GitHub API 操作 ============
async function githubReadFile() {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_DATA_PATH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const data = await res.json();
  githubDataSha = data.sha;
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(content);
}

async function githubWriteFile(data) {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_DATA_PATH}`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: `auto-save: ${new Date().toISOString()}`,
    content,
  };
  if (githubDataSha) body.sha = githubDataSha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (res.status === 409) {
    // SHA 冲突，重新读取并更新 SHA
    console.log('⚠️ GitHub SHA 冲突，重新读取...');
    await githubReadFile();
    throw new Error('SHA conflict, will retry');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub write failed: ${res.status} ${errText}`);
  }
  const result = await res.json();
  githubDataSha = result.content.sha;
  console.log(`✅ 数据已保存到 GitHub (SHA: ${githubDataSha.slice(0, 8)}...)`);
}

// ============ 8月 GitHub API 操作 ============
async function githubReadAugustFile() {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_AUGUST_DATA_PATH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read august failed: ${res.status}`);
  const data = await res.json();
  augustGithubDataSha = data.sha;
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return JSON.parse(content);
}

async function githubWriteAugustFile(data) {
  const url = `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${GITHUB_AUGUST_DATA_PATH}`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = {
    message: `auto-save august: ${new Date().toISOString()}`,
    content,
  };
  if (augustGithubDataSha) body.sha = augustGithubDataSha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (res.status === 409) {
    await githubReadAugustFile();
    throw new Error('August SHA conflict, will retry');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub write august failed: ${res.status} ${errText}`);
  }
  const result = await res.json();
  augustGithubDataSha = result.content.sha;
  console.log(`✅ 8月数据已保存到 GitHub (SHA: ${augustGithubDataSha.slice(0, 8)}...)`);
}

function scheduleAugustGithubSave() {
  if (!useGitHub) return;
  augustHasUnsavedChanges = true;
  if (augustSaveTimer) return;
  augustSaveTimer = setTimeout(async () => {
    augustSaveTimer = null;
    if (!augustHasUnsavedChanges) return;
    augustHasUnsavedChanges = false;
    try {
      await githubWriteAugustFile({ tasks: augustMemoryTasks, savedAt: new Date().toISOString() });
    } catch (err) {
      console.error('GitHub 8月保存失败:', err.message);
      augustHasUnsavedChanges = true;
    }
  }, 3000);
}

function scheduleGithubSave() {
  if (!useGitHub) return;
  hasUnsavedChanges = true;
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    if (!hasUnsavedChanges) return;
    hasUnsavedChanges = false;
    try {
      await githubWriteFile({ tasks: memoryTasks, savedAt: new Date().toISOString() });
    } catch (err) {
      console.error('GitHub 保存失败:', err.message);
      hasUnsavedChanges = true; // 下次重试
    }
  }, 3000); // 3秒防抖
}

// ============ 数据库初始化 ============
async function initDatabase() {
  if (MONGODB_URI) {
    // MongoDB 模式
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
        const seedData = generateSeedData();
        await Task.insertMany(seedData.tasks);
        console.log(`种子数据插入完成，共 ${seedData.tasks.length} 条任务`);
      }
      useMongoDB = true;
      console.log('✅ MongoDB 模式启动');
    } catch (err) {
      console.error('❌ MongoDB 连接失败:', err.message);
      console.log('⚠️ 切换到备用存储...');
      initMemoryStore();
    }
  } else if (GITHUB_TOKEN) {
    // GitHub 持久化模式
    try {
      console.log('🔗 正在从 GitHub 加载数据...');
      const data = await githubReadFile();
      if (data && data.tasks && Array.isArray(data.tasks)) {
        memoryTasks = data.tasks;
        console.log(`✅ 从 GitHub 加载 ${memoryTasks.length} 条任务`);
      } else {
        console.log('GitHub 上无有效数据，初始化种子数据...');
        const seedData = generateSeedData();
        memoryTasks = [...seedData.tasks];
        await githubWriteFile({ tasks: memoryTasks, savedAt: new Date().toISOString() });
      }
      useGitHub = true;
      memoryInitialized = true;
      console.log('✅ GitHub 持久化模式启动');
    } catch (err) {
      lastInitError = `GitHub加载失败: ${err.message}`;
      console.error('❌ GitHub 加载失败:', err.message);
      console.log('⚠️ 切换到内存存储模式...');
      initMemoryStore();
    }
  } else {
    // 纯内存模式（本地开发用）
    console.log('⚠️ 未配置 MONGODB_URI 或 GITHUB_TOKEN，使用纯内存存储');
    console.log('💡 设置 GITHUB_TOKEN 环境变量可启用数据持久化');
    initMemoryStore();
  }
}

function initMemoryStore() {
  const seedData = generateSeedData();
  memoryTasks = [...seedData.tasks];
  memoryInitialized = true;
  console.log(`✅ 内存存储初始化完成，共 ${memoryTasks.length} 条种子任务`);
}

// ============ 8月数据初始化 ============
async function initAugustDatabase() {
  if (GITHUB_TOKEN) {
    try {
      console.log('🔗 正在从 GitHub 加载8月数据...');
      const data = await githubReadAugustFile();
      if (data && data.tasks && Array.isArray(data.tasks)) {
        augustMemoryTasks = data.tasks;
        console.log(`✅ 从 GitHub 加载 ${augustMemoryTasks.length} 条8月任务`);
      } else {
        console.log('GitHub 上无8月数据，初始化种子数据...');
        const seedData = generateAugustSeedData();
        augustMemoryTasks = [...seedData.tasks];
        await githubWriteAugustFile({ tasks: augustMemoryTasks, savedAt: new Date().toISOString() });
      }
      augustMemoryInitialized = true;
      console.log('✅ 8月 GitHub 持久化模式启动');
    } catch (err) {
      console.error('❌ 8月 GitHub 加载失败:', err.message);
      const seedData = generateAugustSeedData();
      augustMemoryTasks = [...seedData.tasks];
      augustMemoryInitialized = true;
      console.log('⚠️ 8月切换到内存存储模式');
    }
  } else {
    const seedData = generateAugustSeedData();
    augustMemoryTasks = [...seedData.tasks];
    augustMemoryInitialized = true;
    console.log(`✅ 8月内存存储初始化完成，共 ${augustMemoryTasks.length} 条种子任务`);
  }
}

// ============ 中间件 ============
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ API ============
app.post('/api/login', (req, res) => {
  const { identity, password } = req.body;
  const user = USERS[identity];
  if (!user || user.password !== password) {
    return res.json({ success: false, message: '密码错误或身份不存在' });
  }
  const token = crypto.randomBytes(16).toString('hex');
  res.json({ success: true, user: { token, identity, role: user.role, name: user.name || identity } });
});

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

app.post('/api/tasks', async (req, res) => {
  try {
    const task = req.body;
    const id = 'task_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const now = new Date().toISOString();
    const newTask = { ...task, id, createdAt: now, updatedAt: now };

    if (useMongoDB) {
      const savedTask = await new Task(newTask).save();
      io.emit('task_created', savedTask.toObject());
      res.json({ success: true, task: savedTask.toObject() });
    } else {
      memoryTasks.push(newTask);
      io.emit('task_created', newTask);
      res.json({ success: true, task: newTask });
      if (useGitHub) scheduleGithubSave();
    }
  } catch (err) {
    console.error('创建任务失败:', err.message);
    res.json({ success: false, message: '创建任务失败' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();

    if (useMongoDB) {
      const updatedTask = await Task.findOneAndUpdate(
        { id: taskId }, updates,
        { new: true, runValidators: true }
      ).lean();
      if (!updatedTask) return res.json({ success: false, message: '任务不存在' });
      io.emit('task_updated', updatedTask);
      res.json({ success: true, task: updatedTask });
    } else {
      const idx = memoryTasks.findIndex(t => t.id === taskId);
      if (idx === -1) return res.json({ success: false, message: '任务不存在' });
      memoryTasks[idx] = { ...memoryTasks[idx], ...updates };
      io.emit('task_updated', memoryTasks[idx]);
      res.json({ success: true, task: memoryTasks[idx] });
      if (useGitHub) scheduleGithubSave();
    }
  } catch (err) {
    console.error('更新任务失败:', err.message);
    res.json({ success: false, message: '更新任务失败' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    if (useMongoDB) {
      const deleted = await Task.findOneAndDelete({ id: taskId }).lean();
      if (!deleted) return res.json({ success: false, message: '任务不存在' });
      io.emit('task_deleted', { id: taskId });
      res.json({ success: true });
    } else {
      const idx = memoryTasks.findIndex(t => t.id === taskId);
      if (idx === -1) return res.json({ success: false, message: '任务不存在' });
      memoryTasks.splice(idx, 1);
      io.emit('task_deleted', { id: taskId });
      res.json({ success: true });
      if (useGitHub) scheduleGithubSave();
    }
  } catch (err) {
    console.error('删除任务失败:', err.message);
    res.json({ success: false, message: '删除任务失败' });
  }
});

app.get('/api/sync-status', (req, res) => {
  const mode = useMongoDB ? 'mongodb' : (useGitHub ? 'github' : 'memory');
  res.json({
    mode,
    persistent: useMongoDB || useGitHub,
    taskCount: memoryTasks.length,
    hasGithubToken: !!GITHUB_TOKEN,
    hasGithubRepo: !!GITHUB_REPO,
    githubRepo: GITHUB_REPO,
    lastInitError,
    message: useMongoDB
      ? '数据持久化到 MongoDB，重启不丢失'
      : useGitHub
        ? '数据持久化到 GitHub 仓库，重启自动恢复'
        : '内存存储模式，重启后恢复为种子数据'
  });
});

// ============ 8月 API ============
app.post('/api/august/login', (req, res) => {
  const { identity, password } = req.body;
  const user = USERS[identity];
  if (!user || user.password !== password) {
    return res.json({ success: false, message: '密码错误或身份不存在' });
  }
  const token = crypto.randomBytes(16).toString('hex');
  res.json({ success: true, user: { token, identity, role: user.role, name: user.name || identity } });
});

app.get('/api/august/data', async (req, res) => {
  try {
    res.json({ success: true, data: { tasks: augustMemoryTasks } });
  } catch (err) {
    res.json({ success: false, message: '8月数据加载失败' });
  }
});

app.post('/api/august/tasks', async (req, res) => {
  try {
    const task = req.body;
    const id = 'aug_task_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const now = new Date().toISOString();
    const newTask = { ...task, id, createdAt: now, updatedAt: now };
    augustMemoryTasks.push(newTask);
    io.emit('august_task_created', newTask);
    res.json({ success: true, task: newTask });
    if (useGitHub) scheduleAugustGithubSave();
  } catch (err) {
    res.json({ success: false, message: '创建8月任务失败' });
  }
});

app.put('/api/august/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();
    const idx = augustMemoryTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return res.json({ success: false, message: '8月任务不存在' });
    augustMemoryTasks[idx] = { ...augustMemoryTasks[idx], ...updates };
    io.emit('august_task_updated', augustMemoryTasks[idx]);
    res.json({ success: true, task: augustMemoryTasks[idx] });
    if (useGitHub) scheduleAugustGithubSave();
  } catch (err) {
    res.json({ success: false, message: '更新8月任务失败' });
  }
});

app.delete('/api/august/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const idx = augustMemoryTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return res.json({ success: false, message: '8月任务不存在' });
    augustMemoryTasks.splice(idx, 1);
    io.emit('august_task_deleted', { id: taskId });
    res.json({ success: true });
    if (useGitHub) scheduleAugustGithubSave();
  } catch (err) {
    res.json({ success: false, message: '删除8月任务失败' });
  }
});

app.get('/api/august/sync-status', (req, res) => {
  res.json({
    mode: useGitHub ? 'github' : 'memory',
    persistent: useGitHub,
    taskCount: augustMemoryTasks.length,
    message: useGitHub
      ? '8月数据持久化到 GitHub 仓库，重启自动恢复'
      : '8月内存存储模式，重启后恢复为种子数据'
  });
});

// ============ WebSocket 实时同步 ============
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);
  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
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
  socket.on('request_august_sync', () => {
    socket.emit('august_full_sync', { tasks: augustMemoryTasks });
  });
});

// ============ 启动服务 ============
initDatabase().then(async () => {
  await initAugustDatabase();
  server.listen(PORT, () => {
    console.log(`🚀 销售工作计划拆解器服务已启动，端口: ${PORT}`);
    const modeStr = useMongoDB ? 'MongoDB持久化' : (useGitHub ? 'GitHub持久化' : '内存存储');
    console.log(`📦 7月存储模式: ${modeStr}`);
    console.log(`📦 8月存储模式: ${useGitHub ? 'GitHub持久化' : '内存存储'}`);
    console.log(`📊 7月任务数: ${memoryTasks.length} | 8月任务数: ${augustMemoryTasks.length}`);
  });
});

// 优雅关闭：保存数据后退出
process.on('SIGTERM', async () => {
  console.log('服务正在关闭...');
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (augustSaveTimer) {
    clearTimeout(augustSaveTimer);
    augustSaveTimer = null;
  }
  if (useGitHub && hasUnsavedChanges) {
    try {
      hasUnsavedChanges = false;
      await githubWriteFile({ tasks: memoryTasks, savedAt: new Date().toISOString() });
      console.log('✅ 关闭前7月数据已保存到 GitHub');
    } catch (err) {
      console.error('关闭前7月保存失败:', err.message);
    }
  }
  if (useGitHub && augustHasUnsavedChanges) {
    try {
      augustHasUnsavedChanges = false;
      await githubWriteAugustFile({ tasks: augustMemoryTasks, savedAt: new Date().toISOString() });
      console.log('✅ 关闭前8月数据已保存到 GitHub');
    } catch (err) {
      console.error('关闭前8月保存失败:', err.message);
    }
  }
  if (useMongoDB && mongoose) {
    await mongoose.connection.close();
  }
  server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  process.emit('SIGTERM');
});
