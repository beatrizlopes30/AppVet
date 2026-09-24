// Ponto de entrada: navegacao entre views e inicializacao geral do app.

const VIEW_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do controle parasitário' },
  horses: { title: 'Equinos', subtitle: 'Cadastro individualizado dos animais' },
  records: { title: 'Dados Clínicos', subtitle: 'Exames, OPG, parasitas e vermifugações' },
  opg: { title: 'Histórico de OPG', subtitle: 'Acompanhamento cronológico e gráfico' },
  alerts: { title: 'Alertas', subtitle: 'OPG acima do limite e vermifugações pendentes' },
  protocols: { title: 'Protocolos', subtitle: 'Protocolos antiparasitários por equino' }
};

function switchView(view) {
  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === `view-${view}`);
  });

  const meta = VIEW_META[view];
  document.getElementById('view-title').textContent = meta.title;
  document.getElementById('view-subtitle').textContent = meta.subtitle;

  closeSidebar();

  if (view === 'opg') renderOpgViewAll();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

function toggleSidebar() {
  const isOpen = document.getElementById('sidebar').classList.contains('open');
  if (isOpen) closeSidebar(); else openSidebar();
}

function renderAll() {
  renderDashboard();
  renderHorseGrid();
  renderRecordsTable();
  renderAlertsView();
  renderProtocolsTable();
  updateAlertBadge();

  const opgView = document.getElementById('view-opg');
  if (opgView.classList.contains('active')) renderOpgViewAll();
  else populateOpgHorseFilter();
}

function initNav() {
  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-mobile-nav').addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthScreen();
  initNav();
  initHorsesView();
  initRecordsView();
  initOpgView();
  initProtocolsView();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }

  const user = DB.currentUser();
  if (user) enterApp();
});
