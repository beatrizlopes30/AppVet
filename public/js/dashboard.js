// Modulo de Dashboard: sintetiza equinos cadastrados, vermifugacoes pendentes,
// resultados de OPG e protocolos ativos.

function renderDashboard() {
  const horses = DB.horses.all();
  const protocols = DB.protocols.all();
  const alerts = buildAlerts();
  const horsesById = Object.fromEntries(horses.map((h) => [h.id, h]));

  document.getElementById('stat-total-horses').textContent = horses.length;
  document.getElementById('stat-pending-deworm').textContent = alerts.filter((a) => a.type === 'interval').length;
  document.getElementById('stat-opg-alerts').textContent = alerts.filter((a) => a.type === 'opg').length;
  document.getElementById('stat-active-protocols').textContent = protocols.filter((p) => p.active).length;

  const alertsBox = document.getElementById('dashboard-alerts');
  if (alerts.length === 0) {
    alertsBox.innerHTML = '<div class="empty-state">Nenhum alerta no momento. Tudo em dia!</div>';
  } else {
    alertsBox.innerHTML = alerts.slice(0, 5).map(alertItemHtml).join('');
  }

  const recentBox = document.getElementById('dashboard-recent-records');
  const recent = DB.records.all().sort((a, b) => new Date(b.examDate) - new Date(a.examDate)).slice(0, 5);
  if (recent.length === 0) {
    recentBox.innerHTML = '<div class="empty-state">Nenhum registro de OPG cadastrado ainda.</div>';
  } else {
    recentBox.innerHTML = `
      <table>
        <thead><tr><th>Equino</th><th>Data</th><th>OPG</th></tr></thead>
        <tbody>
          ${recent.map((r) => {
            const horse = horsesById[r.horse];
            const over = horse && r.opg > horse.opgThreshold;
            return `<tr>
              <td>${escapeHtml(horse ? horse.name : '—')}</td>
              <td>${formatDateBR(r.examDate)}</td>
              <td><span class="badge ${over ? 'crit' : 'ok'}">${r.opg}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  }
}
