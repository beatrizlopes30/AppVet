// Modulo de Alertas: gera alertas automaticos de OPG acima do limite e de
// intervalo de vermifugacao excedido, a partir dos parametros configurados por equino.

function buildAlerts() {
  const horses = DB.horses.all();
  const alerts = [];
  const today = new Date();

  for (const horse of horses) {
    const records = DB.records.query((r) => r.horse === horse.id).sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
    if (records.length === 0) continue;

    const latest = records[0];
    if (latest.opg > horse.opgThreshold) {
      alerts.push({
        type: 'opg',
        horseId: horse.id,
        horseName: horse.name,
        message: `OPG acima do limite configurado: ${horse.name} apresentou OPG de ${latest.opg} em ${formatDateBR(latest.examDate)}.`,
        examDate: latest.examDate
      });
    }

    const dewormed = records.filter((r) => r.dewormingDate);
    if (dewormed.length > 0) {
      const last = dewormed.reduce((a, b) => (new Date(a.dewormingDate) > new Date(b.dewormingDate) ? a : b));
      const elapsed = daysBetween(today, new Date(last.dewormingDate));
      if (elapsed >= horse.dewormingIntervalDays) {
        alerts.push({
          type: 'interval',
          horseId: horse.id,
          horseName: horse.name,
          message: `Intervalo de acompanhamento atingido: revisar o manejo parasitário de ${horse.name}.`,
          elapsedDays: elapsed
        });
      }
    }
  }

  return alerts;
}

function alertItemHtml(alert) {
  return `
    <div class="alert-item ${alert.type}">
      <span class="dot"></span>
      <div class="txt">
        <strong>${alert.type === 'opg' ? 'Alerta de OPG' : 'Vermifugação pendente'}</strong>
        ${escapeHtml(alert.message)}
      </div>
    </div>
  `;
}

function renderAlertsView() {
  const alerts = buildAlerts();
  const list = document.getElementById('alerts-list');
  const empty = document.getElementById('alerts-empty');

  if (alerts.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = alerts.map(alertItemHtml).join('');
}

function updateAlertBadge() {
  const alerts = buildAlerts();
  const badge = document.getElementById('nav-alert-badge');
  if (alerts.length === 0) {
    badge.classList.add('hidden');
  } else {
    badge.classList.remove('hidden');
    badge.textContent = alerts.length;
  }
}
