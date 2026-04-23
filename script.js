/* =========================================================
   HelpDesk DSA - Vanilla JS Implementation
   Concepts: Priority Queue, FIFO Queue, Stack, Search, Sort
   Storage: localStorage (no backend)
   ========================================================= */

// ---------- STORAGE KEYS ----------
const TICKETS_KEY = 'helpdesk_tickets';
const ACTIONS_KEY = 'helpdesk_actions';

// ---------- PRIORITY WEIGHTS (for Priority Queue) ----------
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

// ---------- STATE ----------
let tickets = [];      // array of ticket objects
let actionStack = [];  // stack for undo

// ---------- LOAD FROM localStorage ----------
function loadData() {
  const t = localStorage.getItem(TICKETS_KEY);
  const a = localStorage.getItem(ACTIONS_KEY);
  tickets = t ? JSON.parse(t) : [];
  actionStack = a ? JSON.parse(a) : [];
  if (tickets.length === 0) seedTickets();
}

// ---------- SAVE TO localStorage ----------
function saveData() {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(actionStack));
}

// ---------- SEED DATA ----------
function seedTickets() {
  const now = Date.now();
  tickets = [
    { id: 'TKT-10001', name: 'Aarav Singh', title: 'Laptop will not boot', description: 'My company laptop shows blue screen on startup.', priority: 'high', status: 'open', createdAt: now - 500000, updatedAt: now - 500000 },
    { id: 'TKT-10002', name: 'Priya Sharma', title: 'VPN access request', description: 'Need VPN access to work from home.', priority: 'medium', status: 'in-progress', createdAt: now - 400000, updatedAt: now - 400000 },
    { id: 'TKT-10003', name: 'Rahul Verma', title: 'Outlook crashes on startup', description: 'Outlook closes immediately when opened.', priority: 'high', status: 'open', createdAt: now - 300000, updatedAt: now - 300000 },
    { id: 'TKT-10004', name: 'Sneha Kapoor', title: 'Printer toner low', description: 'Office printer needs new toner.', priority: 'low', status: 'open', createdAt: now - 200000, updatedAt: now - 200000 },
    { id: 'TKT-10005', name: 'Vikram Patel', title: 'Slack notifications missing', description: 'I am not receiving Slack notifications.', priority: 'medium', status: 'closed', createdAt: now - 100000, updatedAt: now - 100000 }
  ];
  saveData();
}

// ---------- GENERATE UNIQUE TICKET ID ----------
function generateId() {
  const max = tickets.reduce((m, t) => {
    const n = parseInt(t.id.split('-')[1], 10);
    return n > m ? n : m;
  }, 10000);
  return 'TKT-' + (max + 1);
}

// ---------- ADD TICKET (Enqueue into Priority Queue) ----------
function addTicket(data) {
  const ticket = {
    id: generateId(),
    name: data.name.trim(),
    title: data.title.trim(),
    description: data.description.trim(),
    priority: data.priority,
    status: 'open',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  tickets.push(ticket);
  actionStack.push({ type: 'create', ticketId: ticket.id, timestamp: Date.now() });
  saveData();
  return ticket;
}

// ---------- CHANGE STATUS (push to undo stack) ----------
function changeStatus(id, newStatus) {
  const t = tickets.find(x => x.id === id);
  if (!t) return;
  actionStack.push({
    type: 'status_change',
    ticketId: id,
    previousStatus: t.status,
    newStatus: newStatus,
    timestamp: Date.now()
  });
  t.status = newStatus;
  t.updatedAt = Date.now();
  saveData();
}

// ---------- DELETE TICKET ----------
function deleteTicket(id) {
  const t = tickets.find(x => x.id === id);
  if (!t) return;
  actionStack.push({ type: 'delete', ticket: { ...t }, timestamp: Date.now() });
  tickets = tickets.filter(x => x.id !== id);
  saveData();
}

// ---------- UNDO (Stack pop) ----------
function undoLast() {
  if (actionStack.length === 0) {
    showToast('Nothing to undo');
    return;
  }
  const last = actionStack.pop();

  if (last.type === 'create') {
    tickets = tickets.filter(t => t.id !== last.ticketId);
    showToast('Undid ticket creation');
  } else if (last.type === 'status_change') {
    const t = tickets.find(x => x.id === last.ticketId);
    if (t) { t.status = last.previousStatus; t.updatedAt = Date.now(); }
    showToast('Undid status change');
  } else if (last.type === 'delete') {
    tickets.push(last.ticket);
    showToast('Restored deleted ticket');
  }
  saveData();
  renderDashboard();
}

// ---------- LINEAR SEARCH ----------
function searchTickets(list, query) {
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(t =>
    t.id.toLowerCase().includes(q) ||
    t.title.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q)
  );
}

// ---------- SORT (Priority Queue / Date) ----------
function sortTickets(list, sortBy) {
  const copy = [...list];
  if (sortBy === 'priority') {
    copy.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
  } else {
    copy.sort((a, b) => b.createdAt - a.createdAt);
  }
  return copy;
}

// ---------- FILTER ----------
function filterTickets(list, priority, status) {
  return list.filter(t =>
    (priority === 'all' || t.priority === priority) &&
    (status === 'all' || t.status === status)
  );
}

// ---------- RENDER DASHBOARD ----------
function renderDashboard() {
  document.getElementById('statTotal').textContent = tickets.length;
  document.getElementById('statOpen').textContent = tickets.filter(t => t.status === 'open').length;
  document.getElementById('statProgress').textContent = tickets.filter(t => t.status === 'in-progress').length;
  document.getElementById('statClosed').textContent = tickets.filter(t => t.status === 'closed').length;

  const query = document.getElementById('searchInput').value;
  const priority = document.getElementById('filterPriority').value;
  const status = document.getElementById('filterStatus').value;
  const sortBy = document.getElementById('sortBy').value;

  let list = searchTickets(tickets, query);
  list = filterTickets(list, priority, status);
  list = sortTickets(list, sortBy);

  const container = document.getElementById('ticketList');
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#64748b;padding:32px;">No tickets match your filters.</p>';
    return;
  }

  container.innerHTML = list.map(t => `
    <div class="ticket-item">
      <div class="ticket-header">
        <div>
          <div class="ticket-id">${t.id}</div>
          <div class="ticket-title">${escapeHtml(t.title)}</div>
        </div>
        <div>
          <span class="badge badge-${t.priority}">${t.priority}</span>
          <span class="badge badge-${t.status}">${t.status.replace('-', ' ')}</span>
        </div>
      </div>
      <div class="ticket-meta">By <b>${escapeHtml(t.name)}</b> · ${formatDate(t.createdAt)}</div>
      <div class="ticket-desc">${escapeHtml(t.description)}</div>
      <div class="ticket-actions">
        <button data-action="open" data-id="${t.id}">Mark Open</button>
        <button data-action="in-progress" data-id="${t.id}">In Progress</button>
        <button data-action="closed" data-id="${t.id}">Close</button>
        <button class="delete-btn" data-action="delete" data-id="${t.id}">Delete</button>
      </div>
    </div>
  `).join('');
}

// ---------- HELPERS ----------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- ROUTING (simple page switcher) ----------
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageId);
  });
  if (pageId === 'dashboard') renderDashboard();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- EVENT LISTENERS ----------
function setupEvents() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.goto));
  });

  document.getElementById('ticketForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      name: document.getElementById('name').value,
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      priority: document.getElementById('priority').value
    };
    if (!data.name || !data.title || !data.description) {
      showToast('Please fill all fields');
      return;
    }
    const t = addTicket(data);
    showToast('Ticket ' + t.id + ' created!');
    e.target.reset();
    document.getElementById('priority').value = 'medium';
    showPage('dashboard');
  });

  document.getElementById('searchInput').addEventListener('input', renderDashboard);
  document.getElementById('filterPriority').addEventListener('change', renderDashboard);
  document.getElementById('filterStatus').addEventListener('change', renderDashboard);
  document.getElementById('sortBy').addEventListener('change', renderDashboard);
  document.getElementById('undoBtn').addEventListener('click', undoLast);

  document.getElementById('ticketList').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'delete') {
      deleteTicket(id);
      showToast('Ticket deleted (undo available)');
    } else {
      changeStatus(id, action);
      showToast('Status updated to ' + action);
    }
    renderDashboard();
  });
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEvents();
  renderDashboard();
});
