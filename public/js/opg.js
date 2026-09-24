// Modulo de Historico de OPG: filtragem por equino e periodo, visualizacao
// grafica com o limite de OPG configurado, e listagem cronologica dos registros.

let opgChartInstance = null;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function populateOpgHorseFilter() {
  const select = document.getElementById('opg-filter-horse');
  const horses = DB.horses.all().sort((a, b) => a.name.localeCompare(b.name));
  const current = select.value;
  select.innerHTML = '<option value="">Selecione um equino</option>' +
    horses.map((h) => `<option value="${h.id}">${escapeHtml(h.name)}</option>`).join('');
  if (horses.some((h) => h.id === current)) select.value = current;
}

function getFilteredOpgRecords() {
  const horseId = document.getElementById('opg-filter-horse').value;
  const from = document.getElementById('opg-filter-from').value;
  const to = document.getElementById('opg-filter-to').value;

  if (!horseId) return { horse: null, records: [] };

  const horse = DB.horses.get(horseId);
  let records = DB.records.query((r) => r.horse === horseId);

  if (from) records = records.filter((r) => r.examDate >= from);
  if (to) records = records.filter((r) => r.examDate <= to);

  records.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
  return { horse, records };
}

function renderOpgChart() {
  const { horse, records } = getFilteredOpgRecords();
  const wrap = document.getElementById('opg-chart-wrap');
  const empty = document.getElementById('opg-empty');
  const tbody = document.getElementById('opg-history-tbody');

  if (!horse || records.length === 0) {
    wrap.classList.add('hidden');
    empty.classList.remove('hidden');
    tbody.innerHTML = '';
    if (opgChartInstance) { opgChartInstance.destroy(); opgChartInstance = null; }
    return;
  }
  empty.classList.add('hidden');
  wrap.classList.remove('hidden');

  const labels = records.map((r) => formatDateBR(r.examDate));
  const opgValues = records.map((r) => r.opg);
  const limitValues = records.map(() => horse.opgThreshold);

  const ctx = document.getElementById('opg-chart').getContext('2d');
  if (opgChartInstance) opgChartInstance.destroy();

  opgChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'OPG registrado',
          data: opgValues,
          borderColor: cssVar('--series-opg'),
          backgroundColor: cssVar('--series-opg'),
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.15
        },
        {
          label: 'Limite configurado',
          data: limitValues,
          borderColor: cssVar('--series-limit'),
          backgroundColor: cssVar('--series-limit'),
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} OPG`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: cssVar('--border') },
          ticks: { color: cssVar('--text-muted') }
        },
        x: {
          grid: { display: false },
          ticks: { color: cssVar('--text-muted') }
        }
      }
    }
  });

  tbody.innerHTML = [...records].reverse().map((r) => {
    const over = r.opg > horse.opgThreshold;
    return `
      <tr>
        <td>${formatDateBR(r.examDate)}</td>
        <td>${r.opg}</td>
        <td><span class="badge ${over ? 'crit' : 'ok'}">${over ? 'Acima do limite' : 'Dentro do limite'}</span></td>
        <td>${escapeHtml(r.parasites || '—')}</td>
      </tr>
    `;
  }).join('');
}

function initOpgView() {
  document.getElementById('opg-filter-horse').addEventListener('change', renderOpgChart);
  document.getElementById('opg-filter-from').addEventListener('change', renderOpgChart);
  document.getElementById('opg-filter-to').addEventListener('change', renderOpgChart);
  document.getElementById('btn-opg-clear-filter').addEventListener('click', () => {
    document.getElementById('opg-filter-from').value = '';
    document.getElementById('opg-filter-to').value = '';
    renderOpgChart();
  });
}

function renderOpgViewAll() {
  populateOpgHorseFilter();
  renderOpgChart();
}
