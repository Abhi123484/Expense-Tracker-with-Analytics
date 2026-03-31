// ═══════════════════════════════════════════════════════════════
// SpendSense — Frontend Application JavaScript
// ═══════════════════════════════════════════════════════════════

const CATEGORIES = ['Food','Transport','Entertainment','Health','Shopping','Utilities','Education','Other'];
const CAT_EMOJI = {Food:'🍔',Transport:'🚗',Entertainment:'🎬',Health:'💊',Shopping:'🛍️',Utilities:'⚡',Education:'📚',Other:'📦'};
const CAT_COLORS = {Food:'#f7a26a',Transport:'#7c6af7',Entertainment:'#f76a8a',Health:'#6af7c8',Shopping:'#f7d76a',Utilities:'#6aacf7',Education:'#c76af7',Other:'#9898a6'};

const TOKEN_KEY = 'spendsense_token';
const USER_KEY = 'spendsense_user';

let chartInstances = {};
let cachedExpenses = [];
let currentUser = null;

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toLocalMonthStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

let analyticsMonth = toLocalMonthStr(new Date());

// ─── API Helper ─────────────────────────────────────────────
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch('/api' + path, { ...options, headers });
  const data = await res.json();
  if (res.status === 401) {
    handleLogout();
    throw new Error('Session expired. Please login again.');
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('registerForm').classList.toggle('active', tab === 'register');
  document.getElementById('loginError').textContent = '';
  document.getElementById('regError').textContent = '';
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!email || !password) { errEl.textContent = 'Please fill in all fields'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  errEl.textContent = '';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!data.success) { errEl.textContent = data.message; return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    currentUser = data.user;
    showApp();
  } catch (err) {
    errEl.textContent = err.message || 'Login failed';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

async function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const errEl = document.getElementById('regError');
  const btn = document.getElementById('regBtn');

  if (!name || !email || !password || !confirm) { errEl.textContent = 'Please fill in all fields'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; return; }
  if (password !== confirm) { errEl.textContent = 'Passwords do not match'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  errEl.textContent = '';

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (!data.success) { errEl.textContent = data.message; return; }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    currentUser = data.user;
    showApp();
    toast('Welcome to SpendSense!');
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentUser = null;
  cachedExpenses = [];
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appContainer').classList.remove('visible');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('regName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regConfirm').value = '';
  switchAuthTab('login');
}

async function showApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.add('visible');

  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  }

  setGreeting();
  await loadExpenses();
  renderDashboard();
}

// Enter key support on auth forms
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  const authScreen = document.getElementById('authScreen');
  if (authScreen.classList.contains('hidden')) return;
  if (document.getElementById('loginForm').classList.contains('active')) {
    handleLogin();
  } else {
    handleRegister();
  }
});

// ─── Data Layer (API-backed with local cache) ───────────────
async function loadExpenses() {
  try {
    const data = await api('/expenses');
    if (data.success) {
      cachedExpenses = data.data.map(e => ({ ...e, id: e._id }));
    }
  } catch (err) {
    toast('Failed to load expenses', 'error');
  }
}

function getExpenses() {
  return cachedExpenses;
}

// ─── Currency Formatter ─────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// ─── Navigation ─────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
  if (window.innerWidth <= 860) toggleSidebar(false);
  if (page === 'dashboard') renderDashboard();
  else if (page === 'expenses') renderExpensesPage();
  else if (page === 'analytics') renderAnalytics();
}

function toggleSidebar(forceState) {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  const isOpen = typeof forceState === 'boolean' ? !forceState : sb.classList.contains('open');
  sb.classList.toggle('open', !isOpen);
  ov.classList.toggle('open', !isOpen);
}

// ─── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ─── Greeting ───────────────────────────────────────────────
function setGreeting() {
  const h = new Date().getHours();
  let g = 'Good Evening';
  if (h < 12) g = 'Good Morning';
  else if (h < 17) g = 'Good Afternoon';
  const name = currentUser ? ', ' + currentUser.name.split(' ')[0] : '';
  document.getElementById('greetingText').textContent = g + name + '!';
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

// ─── Chart helpers ──────────────────────────────────────────
function destroyChart(key) {
  if (chartInstances[key]) { chartInstances[key].destroy(); delete chartInstances[key]; }
}
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9898a6', font: { family: 'DM Mono', size: 11 } } } },
  scales: {}
};
function axisStyle() {
  return { ticks: { color: '#5a5a6e', font: { family: 'DM Mono', size: 10 } }, grid: { color: 'rgba(35,35,47,0.8)' }, border: { color: 'transparent' } };
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function renderDashboard() {
  const expenses = getExpenses();
  const now = new Date();
  const currentMonth = toLocalMonthStr(now);
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAvg = monthExpenses.length > 0 ? Math.round(total / daysInMonth) : 0;

  const catTotals = {};
  monthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  let topCat = '—';
  let topCatAmt = 0;
  for (const [c, a] of Object.entries(catTotals)) { if (a > topCatAmt) { topCat = c; topCatAmt = a; } }

  document.getElementById('statMonthly').textContent = fmt(total);
  document.getElementById('statDaily').textContent = fmt(dailyAvg);
  document.getElementById('statCount').textContent = monthExpenses.length;
  document.getElementById('statTopCat').textContent = CAT_EMOJI[topCat] ? CAT_EMOJI[topCat] + ' ' + topCat : topCat;
  document.getElementById('sidebarTotal').textContent = fmt(total);

  renderTrendChart(expenses);
  renderCatDoughnut(catTotals);
  renderRecentList(expenses);
}

function renderTrendChart(expenses) {
  destroyChart('trend');
  const labels = [], data = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = toLocalDateStr(d);
    labels.push(d.toLocaleDateString('en-IN', { day:'numeric', month:'short' }));
    data.push(expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0));
  }
  const ctx = document.getElementById('trendChart').getContext('2d');
  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Spent',
        data,
        borderColor: '#7c6af7',
        backgroundColor: 'rgba(124,106,247,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c6af7',
        pointRadius: 4,
      }]
    },
    options: {
      ...chartDefaults,
      scales: { x: axisStyle(), y: { ...axisStyle(), beginAtZero: true } },
      plugins: { ...chartDefaults.plugins, legend: { display: false } }
    }
  });
}

function renderCatDoughnut(catTotals) {
  destroyChart('doughnut');
  const cats = Object.keys(catTotals);
  if (cats.length === 0) return;
  const ctx = document.getElementById('catDoughnut').getContext('2d');
  chartInstances.doughnut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats.map(c => CAT_EMOJI[c] + ' ' + c),
      datasets: [{ data: cats.map(c => catTotals[c]), backgroundColor: cats.map(c => CAT_COLORS[c]), borderWidth: 0 }]
    },
    options: {
      ...chartDefaults,
      cutout: '65%',
      plugins: { legend: { position: 'right', labels: { color: '#9898a6', font: { family: 'DM Mono', size: 11 }, padding: 12 } } }
    }
  });
}

function renderRecentList(expenses) {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
  const recent = sorted.slice(0, 5);
  const container = document.getElementById('recentList');
  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No expenses yet. Add your first one!</p></div>';
    return;
  }
  container.innerHTML = recent.map(e => expenseItemHTML(e)).join('');
}

function expenseItemHTML(e) {
  const color = CAT_COLORS[e.category] || '#9898a6';
  const eid = e.id || e._id;
  return `<div class="expense-item">
    <div class="expense-icon" style="background:${color}22;color:${color}">${CAT_EMOJI[e.category] || '📦'}</div>
    <div class="expense-info">
      <div class="name">${escapeHtml(e.name)}</div>
      <div class="meta">${e.category} · ${e.payment || 'UPI'} · ${fmtDate(e.date)}</div>
    </div>
    <div class="expense-amount">${fmt(e.amount)}</div>
    <div class="expense-actions">
      <button onclick="openEditModal('${eid}')" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="del-btn" onclick="openDeleteModal('${eid}')" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
    </div>
  </div>`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// EXPENSES PAGE
// ═══════════════════════════════════════════════════════════════
function populateFilters() {
  const expenses = getExpenses();
  const months = [...new Set(expenses.map(e => e.date.slice(0, 7)))].sort().reverse();
  const monthSel = document.getElementById('filterMonth');
  const current = monthSel.value;
  monthSel.innerHTML = '<option value="All">All Months</option>' + months.map(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return `<option value="${m}">${label}</option>`;
  }).join('');
  if (current && months.includes(current)) monthSel.value = current;

  const catSel = document.getElementById('filterCategory');
  const curCat = catSel.value;
  catSel.innerHTML = '<option value="All">All Categories</option>' + CATEGORIES.map(c => `<option value="${c}">${CAT_EMOJI[c]} ${c}</option>`).join('');
  if (curCat) catSel.value = curCat;
}

function renderExpensesPage() {
  populateFilters();
  let expenses = getExpenses();
  const search = document.getElementById('filterSearch').value.trim().toLowerCase();
  const cat = document.getElementById('filterCategory').value;
  const month = document.getElementById('filterMonth').value;
  const sort = document.getElementById('filterSort').value;

  if (search) expenses = expenses.filter(e => e.name.toLowerCase().includes(search));
  if (cat !== 'All') expenses = expenses.filter(e => e.category === cat);
  if (month !== 'All') expenses = expenses.filter(e => e.date.startsWith(month));

  switch (sort) {
    case 'oldest': expenses.sort((a, b) => a.date.localeCompare(b.date)); break;
    case 'highest': expenses.sort((a, b) => b.amount - a.amount); break;
    case 'lowest': expenses.sort((a, b) => a.amount - b.amount); break;
    default: expenses.sort((a, b) => b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
  }

  const container = document.getElementById('expensesList');
  if (expenses.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No expenses match your filters.</p></div>';
    return;
  }
  container.innerHTML = expenses.map(e => expenseItemHTML(e)).join('');
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════
function changeAnalyticsMonth(dir) {
  const [y, m] = analyticsMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  analyticsMonth = toLocalMonthStr(d);
  renderAnalytics();
}

function renderAnalytics() {
  const expenses = getExpenses();
  const [yr, mo] = analyticsMonth.split('-').map(Number);
  const days = new Date(yr, mo, 0).getDate();
  const monthExpenses = expenses.filter(e => e.date.startsWith(analyticsMonth));
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const count = monthExpenses.length;
  const dailyAvg = days > 0 ? Math.round(total / days) : 0;
  const biggest = monthExpenses.length > 0 ? Math.max(...monthExpenses.map(e => e.amount)) : 0;

  const monthLabel = new Date(yr, mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  document.getElementById('analyticsMonthLabel').textContent = monthLabel;

  document.getElementById('analyticsBadges').innerHTML = [
    { l: 'Total Spent', v: fmt(total) },
    { l: 'Transactions', v: count },
    { l: 'Daily Avg', v: fmt(dailyAvg) },
    { l: 'Biggest Spend', v: fmt(biggest) }
  ].map(b => `<div class="badge"><div class="b-label">${b.l}</div><div class="b-value">${b.v}</div></div>`).join('');

  const catTotals = {};
  monthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  let highestCat = { name: '—', amount: 0 };
  for (const [c, a] of Object.entries(catTotals)) { if (a > highestCat.amount) highestCat = { name: c, amount: a }; }

  const dailyTotals = {};
  monthExpenses.forEach(e => { dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount; });
  let topDay = { date: '—', amount: 0 };
  for (const [d, a] of Object.entries(dailyTotals)) { if (a > topDay.amount) topDay = { date: d, amount: a }; }

  document.getElementById('analyticsHighlights').innerHTML = `
    <div class="highlight-card">
      <div class="h-label">Highest Expense Category</div>
      <div class="h-name">${highestCat.name !== '—' ? (CAT_EMOJI[highestCat.name] || '') + ' ' + highestCat.name : '—'}</div>
      <div class="h-amount">${fmt(highestCat.amount)}</div>
    </div>
    <div class="highlight-card">
      <div class="h-label">Most Expensive Day</div>
      <div class="h-name">${topDay.date !== '—' ? fmtDate(topDay.date) : '—'}</div>
      <div class="h-amount">${fmt(topDay.amount)}</div>
    </div>`;

  renderDailyBarChart(yr, mo, days, dailyTotals);
  renderCatPieChart(catTotals);
  renderCatBreakdown(catTotals, total);
  renderTop5(monthExpenses);
}

function renderDailyBarChart(yr, mo, days, dailyTotals) {
  destroyChart('dailyBar');
  const labels = [], data = [], colors = [];
  for (let d = 1; d <= days; d++) {
    const ds = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    labels.push(d);
    const val = dailyTotals[ds] || 0;
    data.push(val);
    colors.push(val > 0 ? '#7c6af7' : '#23232f');
  }
  const ctx = document.getElementById('dailyBarChart').getContext('2d');
  chartInstances.dailyBar = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, barPercentage: 0.7 }] },
    options: {
      ...chartDefaults,
      scales: { x: axisStyle(), y: { ...axisStyle(), beginAtZero: true } },
      plugins: { ...chartDefaults.plugins, legend: { display: false } }
    }
  });
}

function renderCatPieChart(catTotals) {
  destroyChart('catPie');
  const cats = Object.keys(catTotals);
  if (cats.length === 0) return;
  const ctx = document.getElementById('catPieChart').getContext('2d');
  chartInstances.catPie = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: cats.map(c => CAT_EMOJI[c] + ' ' + c),
      datasets: [{ data: cats.map(c => catTotals[c]), backgroundColor: cats.map(c => CAT_COLORS[c]), borderWidth: 0 }]
    },
    options: {
      ...chartDefaults,
      plugins: { legend: { position: 'bottom', labels: { color: '#9898a6', font: { family: 'DM Mono', size: 11 }, padding: 10 } } }
    }
  });
}

function renderCatBreakdown(catTotals, total) {
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const container = document.getElementById('catBreakdown');
  if (sorted.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = '<h3>Category Breakdown</h3>' + sorted.map(([c, a]) => {
    const pct = total > 0 ? ((a / total) * 100).toFixed(1) : 0;
    const color = CAT_COLORS[c] || '#9898a6';
    return `<div class="cat-row">
      <div class="c-name">${CAT_EMOJI[c] || '📦'} ${c}</div>
      <div class="c-bar-bg"><div class="c-bar" style="width:${pct}%;background:${color}"></div></div>
      <div class="c-pct">${pct}%</div>
      <div class="c-amt">${fmt(a)}</div>
    </div>`;
  }).join('');
}

function renderTop5(monthExpenses) {
  const sorted = [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const container = document.getElementById('top5List');
  if (sorted.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = '<h3>Top 5 Expenses</h3>' + sorted.map((e, i) => {
    const rank = i + 1;
    return `<div class="top5-item">
      <div class="top5-rank rank-${rank}">${rank}</div>
      <div class="t-info">
        <div class="t-name">${escapeHtml(e.name)}</div>
        <div class="t-meta">${e.category} · ${fmtDate(e.date)}</div>
      </div>
      <div class="t-amount">${fmt(e.amount)}</div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// MODALS — Add / Edit / Delete (API-backed)
// ═══════════════════════════════════════════════════════════════
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Expense';
  document.getElementById('editId').value = '';
  document.getElementById('fieldName').value = '';
  document.getElementById('fieldAmount').value = '';
  document.getElementById('fieldDate').value = toLocalDateStr(new Date());
  document.getElementById('fieldCategory').value = '';
  document.getElementById('fieldPayment').value = 'UPI';
  document.getElementById('fieldNotes').value = '';
  document.getElementById('expenseModal').classList.add('open');
}

function openEditModal(id) {
  const e = getExpenses().find(x => x.id === id || x._id === id);
  if (!e) return;
  document.getElementById('modalTitle').textContent = 'Edit Expense';
  document.getElementById('editId').value = e.id || e._id;
  document.getElementById('fieldName').value = e.name;
  document.getElementById('fieldAmount').value = e.amount;
  document.getElementById('fieldDate').value = e.date;
  document.getElementById('fieldCategory').value = e.category;
  document.getElementById('fieldPayment').value = e.payment || 'UPI';
  document.getElementById('fieldNotes').value = e.notes || '';
  document.getElementById('expenseModal').classList.add('open');
}

function closeModal() {
  document.getElementById('expenseModal').classList.remove('open');
}

async function saveExpense() {
  const name = document.getElementById('fieldName').value.trim();
  const amount = parseFloat(document.getElementById('fieldAmount').value);
  const date = document.getElementById('fieldDate').value;
  const category = document.getElementById('fieldCategory').value;
  const payment = document.getElementById('fieldPayment').value;
  const notes = document.getElementById('fieldNotes').value.trim();

  if (!name || !date || !category) { toast('Please fill all required fields', 'error'); return; }
  if (isNaN(amount) || amount <= 0) { toast('Amount must be greater than 0', 'error'); return; }

  const editId = document.getElementById('editId').value;
  const method = editId ? 'PUT' : 'POST';
  const path = editId ? `/expenses/${editId}` : '/expenses';

  try {
    const data = await api(path, {
      method,
      body: JSON.stringify({ name, amount, date, category, payment, notes }),
    });
    if (!data.success) { toast(data.message || 'Failed to save', 'error'); return; }
    toast(editId ? 'Expense updated!' : 'Expense created!');
    closeModal();
    await loadExpenses();
    renderDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function openDeleteModal(id) {
  document.getElementById('deleteId').value = id;
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
}

async function confirmDelete() {
  const id = document.getElementById('deleteId').value;
  try {
    const data = await api(`/expenses/${id}`, { method: 'DELETE' });
    if (!data.success) { toast(data.message || 'Failed to delete', 'error'); return; }
    toast('Expense deleted!');
    closeDeleteModal();
    await loadExpenses();
    renderDashboard();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ─── Initialize on page load ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (token) {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      showApp();
    }
  }
});
