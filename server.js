const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const { generateSeedData } = require('./seed-data');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

// ============ PostgreSQL 数据库 ============
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// 测试连接并初始化
async function initDatabase() {
  try {
    // 创建 tasks 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        owner VARCHAR(50) NOT NULL,
        level VARCHAR(20) NOT NULL,
        period VARCHAR(30) NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        target_amount NUMERIC DEFAULT 0,
        client TEXT DEFAULT '',
        action TEXT DEFAULT '',
        expected_result TEXT DEFAULT '',
        risk TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT '核心',
        date VARCHAR(30) DEFAULT '',
        week INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 检查是否已有数据
    const countResult = await pool.query('SELECT COUNT(*) FROM tasks');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      // 首次启动：插入种子数据
      console.log('首次启动，正在插入种子数据...');
      const seedData = generateSeedData();
      const tasks = seedData.tasks;

      for (const task of tasks) {
        await pool.query(`
          INSERT INTO tasks (id, owner, level, period, title, description,
            target_amount, client, action, expected_result, risk,
            status, priority, date, week, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          task.id, task.owner, task.level, task.period, task.title, task.description,
          task.targetAmount || 0, task.client || '', task.action || '',
          task.expectedResult || '', task.risk || '', task.status || 'pending',
          task.priority || '核心', task.date || '', task.week || 0,
          task.createdAt || new Date().toISOString(), task.updatedAt || new Date().toISOString()
        ]);
      }
      console.log(`种子数据插入完成，共 ${tasks.length} 条任务`);
    } else {
      console.log(`数据库已有 ${count} 条任务，跳过种子数据`);
    }

    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err.message);
    process.exit(1);
  }
}

// 数据库查询辅助函数
function rowToTask(row) {
  return {
    id: row.id,
    owner: row.owner,
    level: row.level,
    period: row.period,
    title: row.title,
    description: row.description,
    targetAmount: parseFloat(row.target_amount) || 0,
    client: row.client,
    action: row.action,
    expectedResult: row.expected_result,
    risk: row.risk,
    status: row.status,
    priority: row.priority,
    date: row.date,
    week: row.week,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at');
    const tasks = result.rows.map(rowToTask);
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

    await pool.query(`
      INSERT INTO tasks (id, owner, level, period, title, description,
        target_amount, client, action, expected_result, risk,
        status, priority, date, week, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      id, task.owner || '', task.level || '', task.period || '', task.title || '', task.description || '',
      task.targetAmount || 0, task.client || '', task.action || '',
      task.expectedResult || '', task.risk || '', task.status || 'pending',
      task.priority || '核心', task.date || '', task.week || 0, now, now
    ]);

    const newTask = { ...task, id, createdAt: now, updatedAt: now };
    io.emit('task_created', newTask);
    res.json({ success: true, task: newTask });
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

    // 构建动态UPDATE语句
    const fields = [];
    const values = [];
    let paramIdx = 1;

    const fieldMap = {
      owner: 'owner', level: 'level', period: 'period',
      title: 'title', description: 'description',
      targetAmount: 'target_amount', client: 'client',
      action: 'action', expectedResult: 'expected_result',
      risk: 'risk', status: 'status', priority: 'priority',
      date: 'date', week: 'week'
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (updates[jsKey] !== undefined) {
        fields.push(`${dbKey} = $${paramIdx}`);
        values.push(updates[jsKey]);
        paramIdx++;
      }
    }

    fields.push(`updated_at = $${paramIdx}`);
    values.push(now);
    paramIdx++;

    values.push(taskId);

    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.json({ success: false, message: '任务不存在' });
    }

    const updatedTask = rowToTask(result.rows[0]);
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
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [taskId]);

    if (result.rows.length === 0) {
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
      const result = await pool.query('SELECT * FROM tasks ORDER BY created_at');
      const tasks = result.rows.map(rowToTask);
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
  await pool.end();
  server.close();
  process.exit(0);
});
