// ===== 全局状态 =====
let currentUser = null;
let allTasks = [];
let julyTasks = [];
let augustTasks = [];
let currentMonth = 7;
let currentLevel = 'weekly';
let currentPerson = 'all';

// ===== 手机侧边栏抽屉 =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }
}
// 手机上选择筛选条件后自动关闭侧边栏
function closeSidebarOnMobile() {
  if (window.innerWidth <= 480) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}
let currentWeek = 1;
let currentDay = null;
let currentPriority = 'all';
let socket = null;

// ===== 2026年7月日历映射 =====
const julyCalendar = {
  weekdays: {
    1:'周三',2:'周四',3:'周五',4:'周六',5:'周日',
    6:'周一',7:'周二',8:'周三',9:'周四',10:'周五',
    11:'周六',12:'周日',13:'周一',14:'周二',15:'周三',
    16:'周四',17:'周五',18:'周六',19:'周日',20:'周一',
    21:'周二',22:'周三',23:'周四',24:'周五',25:'周六',
    26:'周日',27:'周一',28:'周二',29:'周三',30:'周四',31:'周五'
  },
  // 周次映射: day -> week number (对齐真实日历)
  weekMap: {
    1:1,2:1,3:1,
    6:2,7:2,8:2,9:2,10:2,
    13:3,14:3,15:3,16:3,17:3,
    20:4,21:4,22:4,23:4,24:4,
    27:5,28:5,29:5,30:5,31:5
  },
  // 周日期范围（仅工作日）
  weekWorkdays: {
    1: [1,2,3],           // 7/1(周三)-7/3(周五)
    2: [6,7,8,9,10],      // 7/6(周一)-7/10(周五)
    3: [13,14,15,16,17],  // 7/13(周一)-7/17(周五)
    4: [20,21,22,23,24],  // 7/20(周一)-7/24(周五)
    5: [27,28,29,30,31]   // 7/27(周一)-7/31(周五)
  },
  // 周标签（含星期信息）
  weekLabels: {
    1: '7/1周三-7/3周五',
    2: '7/6周一-7/10周五',
    3: '7/13周一-7/17周五',
    4: '7/20周一-7/24周五',
    5: '7/27周一-7/31周五'
  },
  isWeekend: (d) => d===4||d===5||d===11||d===12||d===18||d===19||d===25||d===26,
  isWorkday: (d) => !julyCalendar.isWeekend(d)
};

// ===== 2026年8月日历映射 =====
const augustCalendar = {
  weekdays: {
    1:'周六',2:'周日',
    3:'周一',4:'周二',5:'周三',6:'周四',7:'周五',
    8:'周六',9:'周日',
    10:'周一',11:'周二',12:'周三',13:'周四',14:'周五',
    15:'周六',16:'周日',
    17:'周一',18:'周二',19:'周三',20:'周四',21:'周五',
    22:'周六',23:'周日',
    24:'周一',25:'周二',26:'周三',27:'周四',28:'周五',
    29:'周六',30:'周日',
    31:'周一'
  },
  weekMap: {
    3:1,4:1,5:1,6:1,7:1,
    10:2,11:2,12:2,13:2,14:2,
    17:3,18:3,19:3,20:3,21:3,
    24:4,25:4,26:4,27:4,28:4,
    31:5
  },
  weekWorkdays: {
    1: [3,4,5,6,7],
    2: [10,11,12,13,14],
    3: [17,18,19,20,21],
    4: [24,25,26,27,28],
    5: [31]
  },
  weekLabels: {
    1: '8/3周一-8/7周五',
    2: '8/10周一-8/14周五',
    3: '8/17周一-8/21周五',
    4: '8/24周一-8/28周五',
    5: '8/31周一'
  },
  isWeekend: (d) => d===1||d===2||d===8||d===9||d===15||d===16||d===22||d===23||d===29||d===30,
  isWorkday: (d) => !augustCalendar.isWeekend(d)
};

// ===== 月份工具函数 =====
function getCalendar() { return currentMonth === 7 ? julyCalendar : augustCalendar; }
function getApiBase() { return currentMonth === 7 ? '/api' : '/api/august'; }
function getMonthLabel() { return currentMonth === 7 ? '七月' : '八月'; }
function getMonthNum() { return currentMonth; }
function getMonthPeriod() { return currentMonth === 7 ? '2026-07' : '2026-08'; }

function switchMonth(month) {
  if (month === currentMonth) return;
  currentMonth = month;
  // Update toggle buttons
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.month) === month);
  });
  // Update tasks pointer
  allTasks = month === 7 ? julyTasks : augustTasks;
  // Update week button labels
  updateWeekButtons();
  // Reset filters
  currentWeek = 1;
  currentDay = null;
  document.querySelectorAll('.week-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.week) === 1);
  });
  // Reload data
  refreshData();
  // Reset to weekly view
  switchLevel('weekly');
}

function updateWeekButtons() {
  const cal = getCalendar();
  document.querySelectorAll('.week-btn').forEach(btn => {
    const w = parseInt(btn.dataset.week);
    const label = cal.weekLabels[w] || '';
    btn.innerHTML = `第${w}周<br><small>${label}</small>`;
  });
}

// ===== 初始化 =====
function init() {
  setupSocketIO();
}

function setupSocketIO() {
  socket = io();
  socket.on('connect', () => {
    updateSyncStatus('已连接');
    socket.emit('request_sync');
    socket.emit('request_august_sync');
  });
  // 7月事件
  socket.on('full_sync', (data) => {
    if (data && data.tasks) {
      julyTasks = data.tasks;
      if (currentMonth === 7) { allTasks = julyTasks; if (currentUser) renderCurrentView(); }
    }
  });
  socket.on('task_created', (task) => {
    julyTasks.push(task);
    if (currentMonth === 7) { allTasks = julyTasks; if (currentUser) renderCurrentView(); }
  });
  socket.on('task_updated', (task) => {
    const idx = julyTasks.findIndex(t => t.id === task.id);
    if (idx !== -1) julyTasks[idx] = task;
    if (currentMonth === 7) { allTasks = julyTasks; if (currentUser) renderCurrentView(); }
  });
  socket.on('task_deleted', ({id}) => {
    julyTasks = julyTasks.filter(t => t.id !== id);
    if (currentMonth === 7) { allTasks = julyTasks; if (currentUser) renderCurrentView(); }
  });
  // 8月事件
  socket.on('august_full_sync', (data) => {
    if (data && data.tasks) {
      augustTasks = data.tasks;
      if (currentMonth === 8) { allTasks = augustTasks; if (currentUser) renderCurrentView(); }
    }
  });
  socket.on('august_task_created', (task) => {
    augustTasks.push(task);
    if (currentMonth === 8) { allTasks = augustTasks; if (currentUser) renderCurrentView(); }
  });
  socket.on('august_task_updated', (task) => {
    const idx = augustTasks.findIndex(t => t.id === task.id);
    if (idx !== -1) augustTasks[idx] = task;
    if (currentMonth === 8) { allTasks = augustTasks; if (currentUser) renderCurrentView(); }
  });
  socket.on('august_task_deleted', ({id}) => {
    augustTasks = augustTasks.filter(t => t.id !== id);
    if (currentMonth === 8) { allTasks = augustTasks; if (currentUser) renderCurrentView(); }
  });
  socket.on('disconnect', () => updateSyncStatus('已断开'));
}

function updateSyncStatus(text) {
  const el = document.getElementById('syncStatus');
  el.textContent = text.includes('断开') ? '⚠️ ' + text : '🔄 ' + text;
}

// ===== 登录 =====
function handleLogin() {
  const identity = document.getElementById('loginIdentity').value;
  const password = document.getElementById('loginPassword').value;
  if (!identity) { showLoginError('请选择身份'); return; }
  if (!password) { showLoginError('请输入密码'); return; }

  fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({identity, password})
  })
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      currentUser = res.user;
      sessionStorage.setItem('salesPlannerUser', JSON.stringify(currentUser));
      showMainApp();
    } else {
      showLoginError(res.message);
    }
  })
  .catch(() => showLoginError('网络连接失败'));
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

function showMainApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';

  document.getElementById('userBadge').textContent =
    currentUser.role === 'admin' ? '👑 管理员' : currentUser.name;

  // 销售只看自己
  if (currentUser.role === 'sales') {
    currentPerson = currentUser.name;
    // 隐藏人员筛选中的他人按钮
    document.querySelectorAll('.person-btn').forEach(btn => {
      if (btn.dataset.person !== currentUser.name) btn.style.display = 'none';
      else btn.classList.add('active');
    });
    // 隐藏管理员筛选下拉
    document.getElementById('adminPersonFilter').style.display = 'none';
    // 侧栏标题改为当前用户名
    document.querySelector('#personFilters').previousElementSibling.textContent = '当前用户';
    // 默认设为周计划
    currentLevel = 'weekly';
  } else {
    // 管理员模式：显示筛选下拉和增强侧栏
    currentPerson = 'all';
    // 显示管理员筛选下拉
    document.getElementById('adminPersonFilter').style.display = 'flex';
    // 增强侧栏按钮样式
    const personFilters = document.getElementById('personFilters');
    personFilters.classList.add('admin-mode');
    document.querySelectorAll('.person-btn').forEach(btn => {
      btn.classList.add('admin-btn');
      if (btn.dataset.person === 'all') btn.classList.add('active');
    });
    // 侧栏标题改为"按销售筛选"
    document.querySelector('#personFilters').previousElementSibling.textContent = '按销售筛选';
  }

  // 加载数据
  refreshData();
  // 默认切换到周计划
  switchLevel('weekly');
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('salesPlannerUser');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
}

// 检查session恢复
function checkSession() {
  const saved = sessionStorage.getItem('salesPlannerUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    showMainApp();
  }
}

// ===== 数据加载 =====
function refreshData() {
  fetch(getApiBase() + '/data')
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      const tasks = res.data.tasks;
      if (currentMonth === 7) { julyTasks = tasks; allTasks = julyTasks; }
      else { augustTasks = tasks; allTasks = augustTasks; }
      renderCurrentView();
      updateSyncStatus('已同步');
    }
  });
}

// ===== 级别切换 =====
function switchLevel(level) {
  currentLevel = level;
  currentDay = null;

  document.querySelectorAll('.level-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.level === level);
  });

  // 显示/隐藏周选择器
  document.getElementById('weekSelector').style.display =
    (level === 'weekly' || level === 'daily') ? 'block' : 'none';
  document.getElementById('daySelector').style.display =
    level === 'daily' ? 'block' : 'none';

  // 更新面包屑
  const breadcrumb = document.getElementById('levelBreadcrumb');
  const labels = {annual:'年度目标', quarterly:'Q3季度', monthly:getMonthLabel()+'月度', weekly:'第'+currentWeek+'周计划', daily:'日计划'};
  breadcrumb.textContent = '› ' + labels[level];

  if (level === 'daily') {
    renderDayButtons();
  }

  renderCurrentView();
}

// ===== 人员筛选 =====
function filterPerson(person) {
  currentPerson = person;
  document.querySelectorAll('.person-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.person === person);
  });
  // 同步管理员下拉
  const select = document.getElementById('adminPersonSelect');
  if (select) select.value = person;
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 管理员下拉筛选 =====
function adminFilterPerson(value) {
  currentPerson = value;
  // 同步侧栏按钮
  document.querySelectorAll('.person-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.person === value);
  });
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 周次筛选 =====
function filterWeek(week) {
  currentWeek = week;
  currentDay = null;
  document.querySelectorAll('.week-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.week) === week);
  });
  if (currentLevel === 'daily') {
    renderDayButtons();
  }
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 日期按钮 =====
function renderDayButtons() {
  const container = document.getElementById('dayButtons');
  const cal = getCalendar();
  const days = cal.weekWorkdays[currentWeek] || [];
  container.innerHTML = '';
  days.forEach(d => {
    const btn = document.createElement('button');
    btn.className = `day-btn ${currentDay === d ? 'active' : ''}`;
    btn.innerHTML = `${d}日<small>${cal.weekdays[d]}</small>`;
    btn.onclick = () => selectDay(d);
    container.appendChild(btn);
  });
  if (!currentDay && days.length) {
    selectDay(days[0]);
  }
}

function selectDay(day) {
  currentDay = day;
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.startsWith(day + '日'));
  });
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 优先级筛选 =====
function filterPriority(priority) {
  currentPriority = priority;
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === priority);
  });
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 核心渲染 =====
function renderCurrentView() {
  const tasks = getFilteredTasks();
  const titleEl = document.getElementById('contentTitle');
  const cardsEl = document.getElementById('taskCards');

  switch (currentLevel) {
    case 'annual':
      titleEl.textContent = '年度目标总览';
      renderAnnualView(tasks, cardsEl);
      break;
    case 'quarterly':
      titleEl.textContent = 'Q3季度目标';
      renderQuarterlyView(tasks, cardsEl);
      break;
    case 'monthly':
      titleEl.textContent = getMonthLabel() + '月度计划';
      renderMonthlyView(tasks, cardsEl);
      break;
    case 'weekly':
      titleEl.textContent = `第${currentWeek}周计划 (${getMonthNum()}月${getWeekRange(currentWeek)})`;
      renderWeeklyView(tasks, cardsEl);
      break;
    case 'daily':
      titleEl.textContent = `${getMonthNum()}月${currentDay}日计划 (${getCalendar().weekdays[currentDay]})`;
      renderDailyView(tasks, cardsEl);
      break;
  }

  renderStats();
}

function getFilteredTasks() {
  return allTasks.filter(t => {
    // 人员筛选
    if (currentPerson !== 'all' && t.owner !== currentPerson) return false;
    // 级别筛选
    if (t.level !== currentLevel) return false;
    // 周次筛选（周和日级别）
    if ((currentLevel === 'weekly' || currentLevel === 'daily') && t.week !== currentWeek && t.week !== 0) return false;
    // 日期筛选
    if (currentLevel === 'daily') {
      const dayNum = parseInt(t.date?.split('-')?.[2]);
      if (dayNum !== currentDay) return false;
    }
    // 优先级筛选
    if (currentPriority !== 'all' && t.priority !== currentPriority) return false;
    return true;
  });
}

function getWeekRange(w) {
  return getCalendar().weekLabels[w] || '';
}

// ===== 年度视图 =====
function renderAnnualView(tasks, container) {
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">暂无年度目标数据</div></div>';
    return;
  }
  container.className = 'task-cards grid-view';
  container.innerHTML = '';
  tasks.forEach(t => {
    container.appendChild(createTaskCard(t));
  });
}

// ===== 季度视图 =====
function renderQuarterlyView(tasks, container) {
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">暂无季度目标数据</div></div>';
    return;
  }
  container.className = 'task-cards grid-view';
  container.innerHTML = '';
  tasks.forEach(t => {
    container.appendChild(createTaskCard(t));
  });
}

// ===== 月度视图 =====
function renderMonthlyView(tasks, container) {
  const persons = currentPerson === 'all'
    ? ['陆华','过健','刘童','杨景妮','薛琳']
    : [currentPerson];

  container.className = 'task-cards';
  container.innerHTML = '';

  persons.forEach(person => {
    const personTasks = allTasks.filter(t => t.owner === person);
    const monthlyTask = personTasks.find(t => t.level === 'monthly');
    const weekTasks = personTasks.filter(t => t.level === 'weekly');
    const completedAmount = personTasks.filter(t => t.status === 'completed' && (t.level === 'weekly' || t.level === 'daily'))
      .reduce((sum, t) => sum + (t.targetAmount || 0), 0);

    if (!monthlyTask) return;

    const target = monthlyTask.targetAmount || 0;
    const progress = Math.min(100, Math.round((completedAmount / target) * 100));

    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
      <h3>${person} · ${getMonthLabel()}计划</h3>
      <div class="summary-grid">
        <div class="summary-stat">
          <div class="label">${getMonthLabel()}目标</div>
          <div class="value red">${target}万</div>
        </div>
        <div class="summary-stat">
          <div class="label">已完成</div>
          <div class="value green">${completedAmount.toFixed(1)}万</div>
        </div>
        <div class="summary-stat">
          <div class="label">完成率</div>
          <div class="value blue">${progress}%</div>
        </div>
        <div class="summary-stat">
          <div class="label">B类客户目标</div>
          <div class="value">${getMonthlyMeta(person, 'bTarget')}</div>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      <p style="font-size:13px;color:#6b7280;margin-top:12px">${monthlyTask.description || ''}</p>
    `;
    container.appendChild(card);

    // 周度进度条
    const wCard = document.createElement('div');
    wCard.className = 'week-progress-card';
    const weekAmounts = [0,0,0,0,0];
    weekTasks.forEach(t => {
      if (t.week >= 1 && t.week <= 5) weekAmounts[t.week-1] = t.targetAmount || 0;
    });
    const totalW = weekAmounts.reduce((s,v) => s+v, 0) || 1;
    wCard.innerHTML = `
      <h4>${person} · 周度拆解进度</h4>
      <div class="week-progress-bar">
        ${weekAmounts.map((amt, i) => `<div class="week-segment w${i+1}" style="flex:${Math.max(amt/totalW*5, 0.3)}">${amt > 0 ? amt + '万' : '-'}</div>`).join('')}
      </div>
      <div style="display:flex;gap:6px;font-size:12px;color:#6b7280">
        <span>第1周:${weekAmounts[0]}万</span>
        <span>第2周:${weekAmounts[1]}万</span>
        <span>第3周:${weekAmounts[2]}万</span>
        <span>第4周:${weekAmounts[3]}万</span>
        <span>第5周:${weekAmounts[4]}万</span>
      </div>
    `;
    container.appendChild(wCard);

    // 核心客户池
    const clientTasks = personTasks.filter(t => t.level === 'weekly' && t.period === getMonthPeriod() && t.priority);
    if (clientTasks.length) {
      const cCard = document.createElement('div');
      cCard.className = 'summary-card';
      cCard.innerHTML = `<h3>${person} · ${getMonthLabel()}核心客户池</h3>`;
      const cGrid = document.createElement('div');
      cGrid.className = 'task-cards grid-view';
      clientTasks.forEach(ct => cGrid.appendChild(createTaskCard(ct)));
      cCard.appendChild(cGrid);
      container.appendChild(cCard);
    }
  });

  // 月度任务卡片
  const mTasks = tasks.filter(t => t.level === 'monthly');
  if (mTasks.length) {
    const mCard = document.createElement('div');
    mCard.className = 'summary-card';
    mCard.innerHTML = `<h3>月度目标卡片</h3>`;
    const mGrid = document.createElement('div');
    mGrid.className = 'task-cards grid-view';
    mTasks.forEach(mt => mGrid.appendChild(createTaskCard(mt)));
    mCard.appendChild(mGrid);
    container.appendChild(mCard);
  }
}

function getMonthlyMeta(person, key) {
  const meta = {
    '陆华': { bTarget: '3个', newTarget: '10家' },
    '过健': { bTarget: '4个', newTarget: '8家' },
    '刘童': { bTarget: '2个', newTarget: '6家' },
    '杨景妮': { bTarget: '6家', newTarget: '30家' },
    '薛琳': { bTarget: '8家', newTarget: '30家' },
  };
  return meta[person]?.[key] || '-';
}

// ===== 周视图 =====
function renderWeeklyView(tasks, container) {
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">本周暂无计划任务</div></div>';
    return;
  }
  container.className = 'task-cards grid-view';
  container.innerHTML = '';
  // 按优先级排序: 必成 > 冲刺 > 核心 > 补位
  const sorted = [...tasks].sort((a,b) => {
    const order = {'必成':0, '冲刺':1, '核心':2, '补位':3};
    return (order[a.priority]||2) - (order[b.priority]||2);
  });
  sorted.forEach(t => container.appendChild(createTaskCard(t)));
}

// ===== 日视图 =====
function renderDailyView(tasks, container) {
  if (tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">今日暂无任务安排</div></div>';
    return;
  }
  container.className = 'task-cards grid-view';
  container.innerHTML = '';
  const sorted = [...tasks].sort((a,b) => {
    const order = {'必成':0, '冲刺':1, '核心':2, '补位':3};
    return (order[a.priority]||2) - (order[b.priority]||2);
  });
  sorted.forEach(t => container.appendChild(createTaskCard(t)));
}

// ===== 创建任务卡片 =====
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority}`;
  card.onclick = () => openDetailModal(task);

  const statusLabels = {pending:'待执行', in_progress:'进行中', completed:'已完成', cancelled:'已取消'};
  const levelLabels = {annual:'年度', quarterly:'季度', monthly:'月度', weekly:'周', daily:'日'};

  card.innerHTML = `
    <div class="card-header">
      <span class="card-owner owner-${task.owner}">${task.owner}</span>
      <span class="card-status status-${task.status}">${statusLabels[task.status]||task.status}</span>
    </div>
    <div class="card-amount">${task.targetAmount ? task.targetAmount + '万' : ''} <small>${levelLabels[task.level]||''}</small></div>
    <div class="card-title">${task.title}</div>
    <div class="card-desc">${truncate(task.description, 80)}</div>
    <div class="card-meta">
      ${task.client ? `<span class="card-tag">👤 ${task.client}</span>` : ''}
      ${task.action ? `<span class="card-tag">🎯 ${task.action}</span>` : ''}
      ${task.expectedResult ? `<span class="card-tag">📊 ${task.expectedResult}</span>` : ''}
      ${task.risk ? `<span class="card-tag">⚠️ ${task.risk}</span>` : ''}
    </div>
  `;
  return card;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

// ===== 统计面板 =====
function renderStats() {
  const panel = document.getElementById('statsPanel');
  if (!currentUser) return;

  const persons = currentPerson === 'all'
    ? ['陆华','过健','刘童','杨景妮','薛琳']
    : [currentPerson];

  let totalTarget = 0, totalCompleted = 0;
  persons.forEach(p => {
    const mTask = allTasks.find(t => t.owner === p && t.level === 'monthly');
    if (mTask) totalTarget += mTask.targetAmount || 0;
    const completed = allTasks.filter(t => t.owner === p && t.status === 'completed' && (t.level === 'weekly' || t.level === 'daily'))
      .reduce((s,t) => s + (t.targetAmount || 0), 0);
    totalCompleted += completed;
  });

  const progress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
  const pendingCount = allTasks.filter(t => {
    if (currentPerson !== 'all' && t.owner !== currentPerson) return false;
    return t.status === 'pending' && (t.level === 'weekly' || t.level === 'daily');
  }).length;
  const inProgressCount = allTasks.filter(t => {
    if (currentPerson !== 'all' && t.owner !== currentPerson) return false;
    return t.status === 'in_progress' && (t.level === 'weekly' || t.level === 'daily');
  }).length;

  panel.innerHTML = `
    <div class="stat-item">
      <div class="stat-label">${getMonthLabel()}目标</div>
      <div class="stat-value" style="color:var(--red)">${totalTarget}万</div>
      <div class="stat-bar"><div class="stat-fill" style="width:${progress}%;background:var(--accent)"></div></div>
    </div>
    <div class="stat-item">
      <div class="stat-label">已完成</div>
      <div class="stat-value" style="color:var(--green)">${totalCompleted.toFixed(1)}万 (${progress}%)</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">进行中</div>
      <div class="stat-value" style="color:var(--orange)">${inProgressCount}个任务</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">待执行</div>
      <div class="stat-value" style="color:var(--text-secondary)">${pendingCount}个任务</div>
    </div>
  `;
}

// ===== 详情弹窗 =====
function openDetailModal(task) {
  const modal = document.getElementById('detailModal');
  modal.style.display = 'flex';
  document.getElementById('detailTitle').textContent = task.title;

  const statusLabels = {pending:'待执行', in_progress:'进行中', completed:'已完成', cancelled:'已取消'};
  const priorityColors = {'必成':'var(--red)', '冲刺':'var(--blue)', '补位':'var(--green)', '核心':'var(--purple)'};

  document.getElementById('detailBody').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <span class="card-owner owner-${task.owner}">${task.owner}</span>
      <span class="card-status status-${task.status}">${statusLabels[task.status]}</span>
      <span style="font-size:12px;padding:3px 8px;border-radius:4px;background:${priorityColors[task.priority]||'var(--border)'};color:#fff">${task.priority}</span>
    </div>
    ${task.targetAmount ? `<div class="detail-amount">${task.targetAmount}万</div>` : ''}
    <div class="detail-field"><div class="detail-label">详细说明</div><div class="detail-value">${task.description || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">客户</div><div class="detail-value">${task.client || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">关键动作</div><div class="detail-value">${task.action || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">预期结果</div><div class="detail-value">${task.expectedResult || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">风险/兜底</div><div class="detail-value">${task.risk || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">日期</div><div class="detail-value">${task.date || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">更新时间</div><div class="detail-value">${task.updatedAt ? new Date(task.updatedAt).toLocaleString('zh-CN') : '无'}</div></div>
  `;
  // 存当前任务供编辑
  window._currentDetailTask = task;
}

function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
}

function editFromDetail() {
  closeDetailModal();
  openEditModal(window._currentDetailTask);
}

// ===== 新增/编辑弹窗 =====
function openAddModal() {
  const modal = document.getElementById('taskModal');
  modal.style.display = 'flex';
  document.getElementById('modalTitle').textContent = '新增任务';
  document.getElementById('deleteBtn').style.display = 'none';
  document.getElementById('editTaskId').value = '';
  // 默认值
  document.getElementById('editLevel').value = currentLevel;
  document.getElementById('editWeek').value = currentWeek;
  document.getElementById('editPriority').value = '必成';
  document.getElementById('editStatus').value = 'pending';
  if (currentUser.role === 'sales') {
    document.getElementById('editOwner').value = currentUser.name;
  }
  // 根据级别设置默认周期
  const monthPeriod = getMonthPeriod();
  const weekDefault = currentMonth === 7 ? '2026-W28' : '2026-W32';
  const periodDefaults = {annual:'2026', quarterly:'2026-Q3', monthly:monthPeriod, weekly:weekDefault, daily:monthPeriod+'-01'};
  document.getElementById('editPeriod').value = periodDefaults[currentLevel] || '';
  if (currentLevel === 'daily' && currentDay) {
    const mm = currentMonth === 7 ? '07' : '08';
    document.getElementById('editDate').value = `2026-${mm}-${currentDay.toString().padStart(2,'0')}`;
    document.getElementById('editPeriod').value = `2026-${mm}-${currentDay.toString().padStart(2,'0')}`;
  }
  if (currentLevel === 'weekly') {
    document.getElementById('editDate').value = `2026-${currentMonth === 7 ? '07' : '08'}-${getWeekStartDate(currentWeek)}`;
  }
}

function openEditModal(task) {
  const modal = document.getElementById('taskModal');
  modal.style.display = 'flex';
  document.getElementById('modalTitle').textContent = '编辑任务';
  document.getElementById('deleteBtn').style.display = 'inline-block';
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editOwner').value = task.owner;
  document.getElementById('editLevel').value = task.level;
  document.getElementById('editPeriod').value = task.period;
  document.getElementById('editWeek').value = task.week || 0;
  document.getElementById('editTitle').value = task.title;
  document.getElementById('editDescription').value = task.description || '';
  document.getElementById('editAmount').value = task.targetAmount || '';
  document.getElementById('editClient').value = task.client || '';
  document.getElementById('editAction').value = task.action || '';
  document.getElementById('editExpected').value = task.expectedResult || '';
  document.getElementById('editRisk').value = task.risk || '';
  document.getElementById('editPriority').value = task.priority || '核心';
  document.getElementById('editDate').value = task.date || '';
  document.getElementById('editStatus').value = task.status || 'pending';
}

function closeModal() {
  document.getElementById('taskModal').style.display = 'none';
}

function getWeekStartDate(w) {
  if (currentMonth === 7) {
    const starts = {1:'01', 2:'06', 3:'13', 4:'20'};
    return starts[w] || '01';
  } else {
    const starts = {1:'03', 2:'10', 3:'17', 4:'24', 5:'31'};
    return starts[w] || '03';
  }
}

// ===== 保存任务 =====
function saveTask() {
  const taskId = document.getElementById('editTaskId').value;
  const data = {
    owner: document.getElementById('editOwner').value,
    level: document.getElementById('editLevel').value,
    period: document.getElementById('editPeriod').value,
    week: parseInt(document.getElementById('editWeek').value) || 0,
    title: document.getElementById('editTitle').value,
    description: document.getElementById('editDescription').value,
    targetAmount: parseFloat(document.getElementById('editAmount').value) || 0,
    client: document.getElementById('editClient').value,
    action: document.getElementById('editAction').value,
    expectedResult: document.getElementById('editExpected').value,
    risk: document.getElementById('editRisk').value,
    priority: document.getElementById('editPriority').value,
    date: document.getElementById('editDate').value,
    status: document.getElementById('editStatus').value,
  };

  if (!data.title) { alert('请输入任务标题'); return; }
  if (!data.owner) { alert('请选择所属人'); return; }

  if (taskId) {
    // 编辑
    fetch(`${getApiBase()}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
      if (res.success) { closeModal(); }
      else { alert(res.message); }
    });
  } else {
    // 新增
    fetch(`${getApiBase()}/tasks`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
      if (res.success) { closeModal(); }
      else { alert(res.message); }
    });
  }
}

// ===== 删除任务 =====
function deleteTask() {
  const taskId = document.getElementById('editTaskId').value;
  if (!taskId) return;
  if (!confirm('确定删除此任务？此操作不可恢复。')) return;

  fetch(`${getApiBase()}/tasks/${taskId}`, { method: 'DELETE' })
  .then(r => r.json()).then(res => {
    if (res.success) { closeModal(); }
    else { alert(res.message); }
  });
}

// ===== 键盘事件 =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDetailModal();
  }
});

// ===== 启动 =====
window.addEventListener('DOMContentLoaded', () => {
  init();
  checkSession();
});
