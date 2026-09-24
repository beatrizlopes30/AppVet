// Modulo de Dados Clinicos e Parasitologicos: data do exame, OPG, parasitas
// identificados, observacoes clinicas, antiparasitario utilizado e data de vermifugacao.

function horseOptionsHtml(selectedId) {
  const horses = DB.horses.all().sort((a, b) => a.name.localeCompare(b.name));
  if (horses.length === 0) return '<option value="">Cadastre um equino primeiro</option>';
  return horses.map((h) => `<option value="${h.id}" ${h.id === selectedId ? 'selected' : ''}>${escapeHtml(h.name)}</option>`).join('');
}

function recordFormBody(record) {
  const r = record || {};
  return `
    <div class="field">
      <label>Equino *</label>
      <select name="horse" required>${horseOptionsHtml(r.horse)}</select>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Data do exame *</label>
        <input type="date" name="examDate" value="${r.examDate ? r.examDate.slice(0, 10) : todayISO()}" required>
      </div>
      <div class="field">
        <label>OPG (ovos/grama) *</label>
        <input type="number" min="0" name="opg" value="${r.opg ?? ''}" required>
      </div>
    </div>
    <div class="field">
      <label>Parasitas identificados</label>
      <input name="parasites" value="${escapeHtml(r.parasites || '')}" placeholder="Ex.: Strongylus spp.">
    </div>
    <div class="field">
      <label>Observações clínicas</label>
      <textarea name="clinicalObservations" rows="2">${escapeHtml(r.clinicalObservations || '')}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Antiparasitário utilizado</label>
        <input name="antiparasitic" value="${escapeHtml(r.antiparasitic || '')}">
      </div>
      <div class="field">
        <label>Data de vermifugação</label>
        <input type="date" name="dewormingDate" value="${r.dewormingDate ? r.dewormingDate.slice(0, 10) : ''}">
      </div>
    </div>
  `;
}

function readRecordForm(form) {
  const fd = new FormData(form);
  return {
    horse: fd.get('horse'),
    examDate: fd.get('examDate'),
    opg: Number(fd.get('opg')),
    parasites: fd.get('parasites').trim(),
    clinicalObservations: fd.get('clinicalObservations').trim(),
    antiparasitic: fd.get('antiparasitic').trim(),
    dewormingDate: fd.get('dewormingDate') || ''
  };
}

function openNewRecordModal() {
  if (DB.horses.all().length === 0) {
    toast('Cadastre um equino antes de lançar dados clínicos.', 'error');
    return;
  }
  openModal({
    title: 'Novo registro clínico/parasitológico',
    bodyHtml: recordFormBody(),
    submitLabel: 'Registrar',
    onSubmit: (form) => {
      const data = readRecordForm(form);
      if (!data.horse || !data.examDate || Number.isNaN(data.opg)) {
        toast('Preencha equino, data do exame e OPG.', 'error');
        return false;
      }
      const user = DB.currentUser();
      DB.records.create({ ...data, createdBy: user.id });
      toast('Registro salvo com sucesso.');
      renderAll();
    }
  });
}

function openEditRecordModal(id) {
  const record = DB.records.get(id);
  if (!record) return;
  openModal({
    title: 'Editar registro',
    bodyHtml: recordFormBody(record),
    submitLabel: 'Salvar',
    onSubmit: (form) => {
      const data = readRecordForm(form);
      DB.records.update(id, data);
      toast('Registro atualizado.');
      renderAll();
    }
  });
}

function renderRecordsTable() {
  const tbody = document.getElementById('records-tbody');
  const empty = document.getElementById('records-empty');
  const horsesById = Object.fromEntries(DB.horses.all().map((h) => [h.id, h]));
  const records = DB.records.all().sort((a, b) => new Date(b.examDate) - new Date(a.examDate));

  if (records.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = records.map((r) => {
    const horse = horsesById[r.horse];
    const overLimit = horse && r.opg > horse.opgThreshold;
    return `
      <tr>
        <td>${escapeHtml(horse ? horse.name : '—')}</td>
        <td>${formatDateBR(r.examDate)}</td>
        <td><span class="badge ${overLimit ? 'crit' : 'ok'}">${r.opg}</span></td>
        <td>${escapeHtml(r.parasites || '—')}</td>
        <td>${escapeHtml(r.antiparasitic || '—')}</td>
        <td>${r.dewormingDate ? formatDateBR(r.dewormingDate) : '—'}</td>
        <td class="row-actions">
          <button class="btn btn-secondary btn-sm" data-edit="${r.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-del="${r.id}">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openEditRecordModal(btn.dataset.edit));
  });
  tbody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirmDialog('Excluir este registro?')) return;
      DB.records.remove(btn.dataset.del);
      toast('Registro excluído.');
      renderAll();
    });
  });
}

function initRecordsView() {
  document.getElementById('btn-new-record').addEventListener('click', openNewRecordModal);
}
