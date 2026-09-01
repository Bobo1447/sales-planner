// ===== 9月任务拆解器 - 前端逻辑 =====
// 新版特点：周目标为核心（无日计划）、任务带完成度 progress 字段
let currentUser = null;
let allTasks = [];
let currentLevel = 'weekly';
let currentPerson = 'all';
let currentWeek = 1;
let currentProgress = 'all';
let currentPriority = 'all';
let socket = null;

// ===== 2026年9月日历 =====
const septCalendar = {
  weekLabels: {
    1: '9/1周二-9/4周五',
    2: '9/7周一-9/11周五',
    3: '9/14周一-9/18周五',
    4: '9/21周一-9/25周五',
    5: '9/28周一-9/30周三'
  },
  weekTargets: {
    1: '第1周 9/1-9/4', 2: '第2周 9/7-9/11', 3: '第3周 9/14-9/18',
    4: '第4周 9/21-9/25', 5: '第5周 9/28-9/30'
  }
};

const ALL_PERSONS = ['陆华','过健','刘童','杨景妮','薛琳'];
const API_BASE = '/api/sept';
const LEVEL_LABELS = {annual:'年度', monthly:'月度', weekly:'周目标'};
const STATUS_LABELS = {pending:'待执行', in_progress:'进行中', completed:'已完成', cancelled:'已取消'};
const PRIORITY_ORDER = {'必成':0, '冲刺':1, '核心':2, '补位':3};

// ===== 手机侧边栏 =====
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
function closeSidebarOnMobile() {
  if (window.innerWidth <= 480) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
}

// ===== Socket 实时同步 =====
function setupSocketIO() {
  socket = io();
  socket.on('connect', () => {
    updateSyncStatus('已连接');
    socket.emit('request_sept_sync');
  });
  socket.on('sept_full_sync', (data) => {
    if (data && data.tasks) {
      allTasks = data.tasks;
      if (currentUser) renderCurrentView();
    }
  });
  socket.on('sept_task_created', (task) => {
    allTasks.push(task);
    if (currentUser) renderCurrentView();
  });
  socket.on('sept_task_updated', (task) => {
    const idx = allTasks.findIndex(t => t.id === task.id);
    if (idx !== -1) allTasks[idx] = task;
    if (currentUser) renderCurrentView();
  });
  socket.on('sept_task_deleted', ({id}) => {
    allTasks = allTasks.filter(t => t.id !== id);
    if (currentUser) renderCurrentView();
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

  fetch(API_BASE + '/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({identity, password})
  })
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      currentUser = res.user;
      sessionStorage.setItem('septPlannerUser', JSON.stringify(currentUser));
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

  if (currentUser.role === 'sales') {
    currentPerson = currentUser.name;
    document.querySelectorAll('.person-btn').forEach(btn => {
      if (btn.dataset.person !== currentUser.name) btn.style.display = 'none';
      else btn.classList.add('active');
    });
    document.getElementById('adminPersonFilter').style.display = 'none';
    document.querySelector('#personFilters').previousElementSibling.textContent = '当前用户';
  } else {
    currentPerson = 'all';
    document.getElementById('adminPersonFilter').style.display = 'flex';
    const personFilters = document.getElementById('personFilters');
    personFilters.classList.add('admin-mode');
    document.querySelectorAll('.person-btn').forEach(btn => {
      btn.classList.add('admin-btn');
      if (btn.dataset.person === 'all') btn.classList.add('active');
    });
    document.querySelector('#personFilters').previousElementSibling.textContent = '按销售筛选';
  }

  refreshData();
  switchLevel('weekly');
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('septPlannerUser');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
}

function checkSession() {
  const saved = sessionStorage.getItem('septPlannerUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    showMainApp();
  }
}

// ===== 数据加载 =====
function refreshData() {
  fetch(API_BASE + '/data')
  .then(r => r.json())
  .then(res => {
    if (res.success) {
      allTasks = res.data.tasks;
      renderCurrentView();
      updateSyncStatus('已同步');
    }
  });
}

// ===== 级别切换（年度/月度/周目标） =====
function switchLevel(level) {
  currentLevel = level;
  document.querySelectorAll('.level-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.level === level);
  });
  // 周选择器只在周视图显示
  document.getElementById('weekSelector').style.display =
    level === 'weekly' ? 'block' : 'none';

  const breadcrumb = document.getElementById('levelBreadcrumb');
  const labels = {annual:'年度目标总览', monthly:'9月月度计划', weekly:'第'+currentWeek+'周目标'};
  breadcrumb.textContent = '› ' + labels[level];
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 筛选 =====
function filterPerson(person) {
  currentPerson = person;
  document.querySelectorAll('.person-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.person === person);
  });
  const select = document.getElementById('adminPersonSelect');
  if (select) select.value = person;
  renderCurrentView();
  closeSidebarOnMobile();
}

function adminFilterPerson(value) {
  currentPerson = value;
  document.querySelectorAll('.person-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.person === value);
  });
  renderCurrentView();
  closeSidebarOnMobile();
}

function filterWeek(week) {
  currentWeek = week;
  document.querySelectorAll('.week-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.week) === week);
  });
  const breadcrumb = document.getElementById('levelBreadcrumb');
  if (currentLevel === 'weekly') breadcrumb.textContent = '› 第' + currentWeek + '周目标';
  renderCurrentView();
  closeSidebarOnMobile();
}

function filterProgress(progress) {
  currentProgress = progress;
  document.querySelectorAll('[data-progress]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.progress === progress);
  });
  renderCurrentView();
  closeSidebarOnMobile();
}

function filterPriority(priority) {
  currentPriority = priority;
  document.querySelectorAll('.priority-btn[data-priority]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === priority);
  });
  renderCurrentView();
  closeSidebarOnMobile();
}

// ===== 任务过滤 =====
function getFilteredTasks() {
  return allTasks.filter(t => {
    if (currentPerson !== 'all' && t.owner !== currentPerson) return false;
    if (t.level !== currentLevel) return false;
    // 周视图：本周任务(week==currentWeek) + 跨周项目(week==0)
    if (currentLevel === 'weekly') {
      if (t.week !== currentWeek && t.week !== 0) return false;
    }
    // 完成度筛选
    if (currentProgress !== 'all') {
      const p = t.progress || 0;
      if (currentProgress === 'todo' && p > 0) return false;
      if (currentProgress === 'doing' && (p <= 0 || p >= 100)) return false;
      if (currentProgress === 'done' && p < 100) return false;
    }
    // 优先级筛选
    if (currentPriority !== 'all' && t.priority !== currentPriority) return false;
    return true;
  });
}

function getWeekTarget(person, week) {
  return allTasks.find(t => t.owner === person && t.level === 'weekly' && t.week === week) || null;
}

// ===== 完成度工具 =====
function getProgress(task) {
  const p = parseFloat(task?.progress);
  return isNaN(p) ? 0 : Math.max(0, Math.min(100, p));
}
// 已完成金额 = targetAmount * progress%
function getDoneAmount(task) {
  return ((task.targetAmount || 0) * getProgress(task)) / 100;
}
function statusFromProgress(p) {
  if (p >= 100) return 'completed';
  if (p > 0) return 'in_progress';
  return 'pending';
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
    case 'monthly':
      titleEl.textContent = '9月月度计划 · 完成度';
      renderMonthlyView(cardsEl);
      break;
    case 'weekly':
      titleEl.textContent = `第${currentWeek}周目标 (${septCalendar.weekLabels[currentWeek]})`;
      renderWeeklyView(cardsEl);
      break;
  }
  renderStats();
}

// ===== 年度视图 =====
function renderAnnualView(tasks, container) {
  const annualTasks = tasks.filter(t => t.level === 'annual');
  const projects = tasks.filter(t => t.level === 'weekly' && t.week === 0);

  container.className = 'task-cards';
  container.innerHTML = '';

  // 年度目标卡
  if (annualTasks.length) {
    const aCard = document.createElement('div');
    aCard.className = 'summary-card';
    aCard.innerHTML = `<h3>🎯 年度目标</h3>`;
    const grid = document.createElement('div');
    grid.className = 'task-cards grid-view';
    annualTasks.forEach(t => grid.appendChild(createTaskCard(t, {showProgress:true})));
    aCard.appendChild(grid);
    container.appendChild(aCard);
  }

  // 跨周项目（体现项目完成度）
  if (projects.length) {
    const pCard = document.createElement('div');
    pCard.className = 'summary-card';
    pCard.innerHTML = `<h3>📈 重点项目 · 完成度追踪</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">项目为跨周持续推进任务，用完成度（%）反映当前进度，点击卡片可更新。</p>`;
    const grid = document.createElement('div');
    grid.className = 'task-cards grid-view';
    const sorted = [...projects].sort((a,b) => getProgress(b) - getProgress(a));
    sorted.forEach(t => grid.appendChild(createTaskCard(t, {showProgress:true})));
    pCard.appendChild(grid);
    container.appendChild(pCard);
  }

  if (!annualTasks.length && !projects.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-text">暂无年度目标数据</div></div>';
  }
}

// ===== 月度视图：每人汇总 + 周完成度分布 + 项目 =====
function renderMonthlyView(container) {
  const persons = currentPerson === 'all' ? ALL_PERSONS : [currentPerson];
  container.className = 'task-cards';
  container.innerHTML = '';

  persons.forEach(person => {
    const personTasks = allTasks.filter(t => t.owner === person);
    const monthlyTask = personTasks.find(t => t.level === 'monthly');
    const weekTasks = personTasks.filter(t => t.level === 'weekly' && t.week >= 1 && t.week <= 5);
    const projects = personTasks.filter(t => t.level === 'weekly' && t.week === 0);

    if (!monthlyTask) return;

    const target = monthlyTask.targetAmount || 0;
    const doneAmount = weekTasks.reduce((s, t) => s + getDoneAmount(t), 0);
    const progress = target > 0 ? Math.min(100, Math.round((doneAmount / target) * 100)) : 0;

    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
      <h3>${person} · 9月计划 <span class="month-done-badge">已完成 ${doneAmount.toFixed(1)}万 / ${target}万</span></h3>
      <div class="progress-bar lg"><div class="progress-fill ${progress >= 100 ? 'done' : ''}" style="width:${progress}%"></div></div>
      <div class="month-progress-label">完成率 <b>${progress}%</b></div>
      <p style="font-size:13px;color:var(--text-secondary);margin-top:10px">${monthlyTask.description || ''}</p>
    `;
    container.appendChild(card);

    // 周目标进度条（5周）
    const wCard = document.createElement('div');
    wCard.className = 'week-progress-card';
    const weekDone = [0,0,0,0,0];
    const weekTargetArr = [0,0,0,0,0];
    weekTasks.forEach(t => {
      if (t.week >= 1 && t.week <= 5) {
        weekTargetArr[t.week-1] = t.targetAmount || 0;
        weekDone[t.week-1] = getDoneAmount(t);
      }
    });
    const totalW = weekTargetArr.reduce((s,v) => s+v, 0) || 1;
    wCard.innerHTML = `
      <h4>${person} · 周目标拆解与完成度</h4>
      <div class="week-progress-bar">
        ${weekTargetArr.map((amt, i) => {
          const p = amt > 0 ? Math.round((weekDone[i] / amt) * 100) : 0;
          return `<div class="week-segment w${i+1}" style="flex:${Math.max(amt/totalW*5, 0.3)}" title="第${i+1}周：${amt}万，已完成${weekDone[i].toFixed(1)}万(${p}%)">
            <span>${amt > 0 ? amt+'万' : '-'}</span>
            ${p > 0 ? `<small>${p}%</small>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="week-detail-grid">
        ${weekTargetArr.map((amt, i) => {
          const p = amt > 0 ? Math.round((weekDone[i] / amt) * 100) : 0;
          return `<div class="week-detail-item">
            <div class="wd-week">第${i+1}周</div>
            <div class="wd-target">目标 ${amt}万</div>
            <div class="wd-done" style="color:${p >= 100 ? 'var(--green)' : p > 0 ? 'var(--blue)' : 'var(--text-muted)'}">完成 ${weekDone[i].toFixed(1)}万 (${p}%)</div>
            <div class="mini-bar"><div class="mini-fill" style="width:${p}%;background:${p >= 100 ? 'var(--green)' : 'var(--accent)'}"></div></div>
          </div>`;
        }).join('')}
      </div>
    `;
    container.appendChild(wCard);

    // 重点项目（完成度）
    if (projects.length) {
      const pCard = document.createElement('div');
      pCard.className = 'summary-card';
      pCard.innerHTML = `<h3>${person} · 重点项目</h3>`;
      const grid = document.createElement('div');
      grid.className = 'task-cards grid-view';
      projects.forEach(t => grid.appendChild(createTaskCard(t, {showProgress:true})));
      pCard.appendChild(grid);
      container.appendChild(pCard);
    }
  });
}

// ===== 周视图：周目标卡 + 跨周项目 =====
function renderWeeklyView(container) {
  const persons = currentPerson === 'all' ? ALL_PERSONS : [currentPerson];
  container.className = 'task-cards';
  container.innerHTML = '';

  // 周汇总条
  renderWeekSummaryStrip(persons);

  // 本周目标卡（每人一张，周目标）
  let hasWeekTasks = false;
  persons.forEach(person => {
    const weekTask = getWeekTarget(person, currentWeek);
    if (!weekTask) return;
    hasWeekTasks = true;
  });

  const weekCards = document.createElement('div');
  weekCards.className = 'task-cards grid-view';
  persons.forEach(person => {
    const weekTask = getWeekTarget(person, currentWeek);
    if (!weekTask) return;
    weekCards.appendChild(createTaskCard(weekTask, {showProgress:true, highlight:true}));
  });
  if (hasWeekTasks) {
    const wrap = document.createElement('div');
    wrap.className = 'summary-card';
    wrap.innerHTML = `<h3>📋 本周目标（第${currentWeek}周）</h3>`;
    wrap.appendChild(weekCards);
    container.appendChild(wrap);
  }

  // 跨周项目（完成度，仅当完成度筛选非"进行中"过滤时也显示，跟随 getFilteredTasks）
  const projects = getFilteredTasks().filter(t => t.level === 'weekly' && t.week === 0);
  if (projects.length) {
    const pCard = document.createElement('div');
    pCard.className = 'summary-card';
    pCard.innerHTML = `<h3>📈 重点项目 · 完成度</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">跨周持续推进的项目，用完成度百分比追踪进展。</p>`;
    const grid = document.createElement('div');
    grid.className = 'task-cards grid-view';
    const sorted = [...projects].sort((a,b) => getProgress(b) - getProgress(a));
    sorted.forEach(t => grid.appendChild(createTaskCard(t, {showProgress:true})));
    pCard.appendChild(grid);
    container.appendChild(pCard);
  }

  if (!hasWeekTasks && !projects.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">本周暂无计划任务</div></div>';
  }
}

// ===== 周汇总条 =====
function renderWeekSummaryStrip(persons) {
  const strip = document.getElementById('weekSummaryStrip');
  let totalTarget = 0, totalDone = 0;
  persons.forEach(person => {
    const weekTask = getWeekTarget(person, currentWeek);
    if (weekTask) {
      totalTarget += weekTask.targetAmount || 0;
      totalDone += getDoneAmount(weekTask);
    }
  });
  const progress = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;
  strip.style.display = 'block';
  strip.innerHTML = `
    <div class="wss-left">
      <div class="wss-label">本周全员目标</div>
      <div class="wss-values"><b>${totalTarget}万</b> 已完成 <b style="color:var(--green)">${totalDone.toFixed(1)}万</b></div>
    </div>
    <div class="wss-bar"><div class="wss-fill" style="width:${progress}%"></div></div>
    <div class="wss-pct"><b>${progress}%</b></div>
  `;
}

// ===== 任务卡片（含完成度进度条） =====
function createTaskCard(task, opts = {}) {
  const card = document.createElement('div');
  const pri = PRIORITY_ORDER[task.priority] !== undefined ? task.priority : '核心';
  card.className = `task-card priority-${pri}`;
  card.onclick = () => openDetailModal(task);

  const status = task.status || 'pending';
  const progress = getProgress(task);
  const isProject = opts.highlight === true || (task.level === 'weekly' && task.week === 0);
  const showAmount = task.targetAmount > 0;

  card.innerHTML = `
    <div class="card-header">
      <span class="card-owner owner-${task.owner}">${task.owner}</span>
      ${task.level === 'weekly' && task.week === 0 ? '<span class="card-tag tag-project">📈 项目</span>' : ''}
      <span class="card-status status-${status}">${STATUS_LABELS[status] || status}</span>
    </div>
    ${showAmount ? `<div class="card-amount">${task.targetAmount}万 <small>${task.level === 'weekly' ? '本周目标' : LEVEL_LABELS[task.level] || ''}</small></div>` : ''}
    <div class="card-title">${task.title}</div>
    <div class="card-desc">${truncate(task.description, 90)}</div>
    <div class="card-progress-row">
      <div class="card-progress-bar ${progress >= 100 ? 'done' : ''}">
        <div class="card-progress-fill" style="width:${progress}%"></div>
      </div>
      <span class="card-progress-pct ${progress >= 100 ? 'done' : ''}">${progress}%</span>
    </div>
    <div class="card-meta">
      ${task.client ? `<span class="card-tag">👤 ${truncate(task.client, 18)}</span>` : ''}
      ${task.action ? `<span class="card-tag">🎯 ${task.action}</span>` : ''}
      ${task.expectedResult ? `<span class="card-tag">📊 ${truncate(task.expectedResult, 12)}</span>` : ''}
      ${task.risk ? `<span class="card-tag">⚠️ ${truncate(task.risk, 12)}</span>` : ''}
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

  const persons = currentPerson === 'all' ? ALL_PERSONS : [currentPerson];
  let totalTarget = 0, totalDone = 0, doneCount = 0, doingCount = 0, todoCount = 0;

  persons.forEach(p => {
    const mTask = allTasks.find(t => t.owner === p && t.level === 'monthly');
    if (mTask) totalTarget += mTask.targetAmount || 0;
    const weekTasks = allTasks.filter(t => t.owner === p && t.level === 'weekly' && t.week >= 1 && t.week <= 5);
    weekTasks.forEach(t => totalDone += getDoneAmount(t));
    const pTasks = allTasks.filter(t => t.owner === p && t.level === 'weekly' && t.week === 0);
    pTasks.forEach(t => {
      const prog = getProgress(t);
      if (prog >= 100) doneCount++;
      else if (prog > 0) doingCount++;
      else todoCount++;
    });
    weekTasks.forEach(t => {
      const prog = getProgress(t);
      if (prog >= 100) doneCount++;
      else if (prog > 0) doingCount++;
      else todoCount++;
    });
  });

  const progress = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;

  panel.innerHTML = `
    <div class="stat-item">
      <div class="stat-label">9月目标总额</div>
      <div class="stat-value" style="color:var(--red)">${totalTarget}万</div>
      <div class="stat-bar"><div class="stat-fill" style="width:${progress}%;background:var(--accent)"></div></div>
    </div>
    <div class="stat-item">
      <div class="stat-label">已完成（按完成度折算）</div>
      <div class="stat-value" style="color:var(--green)">${totalDone.toFixed(1)}万 (${progress}%)</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">任务完成情况</div>
      <div class="stat-value" style="color:var(--green)">✅ ${doneCount}个</div>
      <div class="stat-value" style="color:var(--orange)">⏳ ${doingCount}个</div>
      <div class="stat-value" style="color:var(--text-secondary)">📭 ${todoCount}个</div>
    </div>
  `;
}

// ===== 详情弹窗（含完成度大进度条） =====
function openDetailModal(task) {
  const modal = document.getElementById('detailModal');
  modal.style.display = 'flex';
  document.getElementById('detailTitle').textContent = task.title;

  const status = task.status || 'pending';
  const progress = getProgress(task);
  const priorityColors = {'必成':'var(--red)', '冲刺':'var(--blue)', '补位':'var(--green)', '核心':'var(--purple)'};

  document.getElementById('detailBody').innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <span class="card-owner owner-${task.owner}">${task.owner}</span>
      <span class="card-status status-${status}">${STATUS_LABELS[status]}</span>
      ${task.level === 'weekly' && task.week === 0 ? '<span class="card-tag tag-project">📈 项目</span>' : ''}
      <span style="font-size:12px;padding:3px 8px;border-radius:4px;background:${priorityColors[task.priority]||'var(--border)'};color:#fff">${task.priority}</span>
    </div>
    ${task.targetAmount ? `<div class="detail-amount">${task.targetAmount}万</div>` : ''}
    <div class="detail-progress-block">
      <div class="detail-progress-label">完成度</div>
      <div class="progress-bar lg"><div class="progress-fill ${progress >= 100 ? 'done' : ''}" style="width:${progress}%"></div></div>
      <div class="detail-progress-pct">${progress}% ${progress >= 100 ? '🎉 已完成' : progress > 0 ? '· 推进中' : '· 未开始'}</div>
    </div>
    <div class="detail-field"><div class="detail-label">详细说明</div><div class="detail-value">${task.description || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">客户</div><div class="detail-value">${task.client || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">关键动作</div><div class="detail-value">${task.action || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">预期结果</div><div class="detail-value">${task.expectedResult || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">风险/兜底</div><div class="detail-value">${task.risk || '无'}</div></div>
    <div class="detail-field"><div class="detail-label">周次</div><div class="detail-value">${task.week === 0 ? '跨周项目' : '第' + task.week + '周 (' + (septCalendar.weekLabels[task.week] || '') + ')'}</div></div>
    <div class="detail-field"><div class="detail-label">更新时间</div><div class="detail-value">${task.updatedAt ? new Date(task.updatedAt).toLocaleString('zh-CN') : '无'}</div></div>
  `;
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
  document.getElementById('editLevel').value = currentLevel === 'annual' ? 'annual' : 'weekly';
  document.getElementById('editWeek').value = currentLevel === 'weekly' ? currentWeek : 0;
  document.getElementById('editPriority').value = '必成';
  document.getElementById('editStatus').value = 'pending';
  document.getElementById('editProgress').value = 0;
  document.getElementById('editProgressNum').textContent = '0%';
  if (currentUser.role === 'sales') {
    document.getElementById('editOwner').value = currentUser.name;
  }
  const periodDefaults = {annual:'2026', monthly:'2026-09', weekly: currentLevel === 'weekly' ? '2026-W'+currentWeek : '2026-09'};
  document.getElementById('editPeriod').value = periodDefaults[currentLevel] || '2026-09';
  document.getElementById('editDate').value = '';
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
  document.getElementById('editStatus').value = task.status || 'pending';
  document.getElementById('editDate').value = task.date || '';
  const p = getProgress(task);
  document.getElementById('editProgress').value = p;
  document.getElementById('editProgressNum').textContent = p + '%';
}

function closeModal() {
  document.getElementById('taskModal').style.display = 'none';
}

// ===== 保存任务 =====
function saveTask() {
  const taskId = document.getElementById('editTaskId').value;
  const progress = parseInt(document.getElementById('editProgress').value) || 0;
  const manualStatus = document.getElementById('editStatus').value;
  // 完成度与状态联动：进度100→已完成，>0→进行中，否则待执行（除非手动取消）
  const status = manualStatus === 'cancelled' ? 'cancelled' : statusFromProgress(progress);

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
    status,
    progress,
  };

  if (!data.title) { alert('请输入任务标题'); return; }
  if (!data.owner) { alert('请选择所属人'); return; }

  if (taskId) {
    fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
      if (res.success) { closeModal(); }
      else { alert(res.message); }
    });
  } else {
    fetch(`${API_BASE}/tasks`, {
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
  fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' })
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
  setupSocketIO();
  checkSession();
});
