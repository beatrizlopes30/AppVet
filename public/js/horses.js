// Modulo de Equinos: cadastro individualizado (nome, numero de registro, raca,
// idade, sexo, pelagem, proprietario, localizacao) + limiares de alerta.

function horseAlertFlags(horse) {
  const records = DB.records.query((r) => r.horse === horse.id);
  const flags = [];

  if (records.length > 0) {
    const latest = [...records].sort((a, b) => new Date(b.examDate) - new Date(a.examDate))[0];
    if (latest.opg > horse.opgThreshold) flags.push({ label: 'OPG acima do limite', cls: 'crit' });

    const dewormed = records.filter((r) => r.dewormingDate);
    if (dewormed.length > 0) {
      const last = dewormed.reduce((a, b) => (new Date(a.dewormingDate) > new Date(b.dewormingDate) ? a : b));
      const elapsed = daysBetween(new Date(), new Date(last.dewormingDate));
      if (elapsed >= horse.dewormingIntervalDays) flags.push({ label: 'Vermifugação atrasada', cls: 'warn' });
    }
  }

  return flags;
}

function renderHorseGrid() {
  const grid = document.getElementById('horse-grid');
  const empty = document.getElementById('horse-empty');
  const horses = DB.horses.all().sort((a, b) => a.name.localeCompare(b.name));

  if (horses.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = horses.map((h) => {
    const flags = horseAlertFlags(h);
    return `
      <div class="horse-card" data-id="${h.id}">
        <div class="name">${escapeHtml(h.name)}</div>
        <div class="meta">
          ${escapeHtml(h.breed || 'Raça não informada')} · ${h.age ? h.age + ' anos' : 'idade n/i'} · ${escapeHtml(h.sex || '')}<br>
          Prop.: ${escapeHtml(h.owner || '—')}<br>
          Local: ${escapeHtml(h.location || '—')}
        </div>
        <div class="flags">
          ${flags.map((f) => `<span class="badge ${f.cls}">${f.label}</span>`).join('') || '<span class="badge ok">Sem alertas</span>'}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.horse-card').forEach((card) => {
    card.addEventListener('click', () => openHorseDetail(card.dataset.id));
  });
}

function horseFormBody(horse) {
  const h = horse || {};
  return `
    <div class="field">
      <label>Nome do equino *</label>
      <input name="name" value="${escapeHtml(h.name || '')}" required>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Número de registro</label>
        <input name="registrationNumber" value="${escapeHtml(h.registrationNumber || '')}">
      </div>
      <div class="field">
        <label>Raça</label>
        <input name="breed" value="${escapeHtml(h.breed || '')}">
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Idade (anos)</label>
        <input type="number" min="0" name="age" value="${h.age ?? ''}">
      </div>
      <div class="field">
        <label>Sexo</label>
        <select name="sex">
          <option value="Macho" ${h.sex === 'Macho' ? 'selected' : ''}>Macho</option>
          <option value="Femea" ${h.sex === 'Femea' ? 'selected' : ''}>Fêmea</option>
          <option value="Castrado" ${h.sex === 'Castrado' ? 'selected' : ''}>Castrado</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Pelagem</label>
        <input name="coat" value="${escapeHtml(h.coat || '')}">
      </div>
      <div class="field">
        <label>Proprietário</label>
        <input name="owner" value="${escapeHtml(h.owner || '')}">
      </div>
    </div>
    <div class="field">
      <label>Localização / estábulo</label>
      <input name="location" value="${escapeHtml(h.location || '')}">
    </div>
    <div class="field-row">
      <div class="field">
        <label>Limite de OPG para alerta</label>
        <input type="number" min="0" name="opgThreshold" value="${h.opgThreshold ?? 500}">
      </div>
      <div class="field">
        <label>Intervalo de vermifugação (dias)</label>
        <input type="number" min="1" name="dewormingIntervalDays" value="${h.dewormingIntervalDays ?? 90}">
      </div>
    </div>
  `;
}

function readHorseForm(form) {
  const fd = new FormData(form);
  return {
    name: fd.get('name').trim(),
    registrationNumber: fd.get('registrationNumber').trim(),
    breed: fd.get('breed').trim(),
    age: fd.get('age') ? Number(fd.get('age')) : null,
    sex: fd.get('sex'),
    coat: fd.get('coat').trim(),
    owner: fd.get('owner').trim(),
    location: fd.get('location').trim(),
    opgThreshold: Number(fd.get('opgThreshold')) || 500,
    dewormingIntervalDays: Number(fd.get('dewormingIntervalDays')) || 90
  };
}

function openNewHorseModal() {
  openModal({
    title: 'Novo equino',
    bodyHtml: horseFormBody(),
    submitLabel: 'Cadastrar',
    onSubmit: (form) => {
      const data = readHorseForm(form);
      if (!data.name) { toast('Informe o nome do equino.', 'error'); return false; }
      const user = DB.currentUser();
      DB.horses.create({ ...data, createdBy: user.id });
      toast('Equino cadastrado com sucesso.');
      renderAll();
    }
  });
}

function openHorseDetail(id) {
  const horse = DB.horses.get(id);
  if (!horse) return;

  const records = DB.records.query((r) => r.horse === id).sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  const protocols = DB.protocols.query((p) => p.horse === id);

  const recordsHtml = records.length
    ? records.slice(0, 5).map((r) => `<li>${formatDateBR(r.examDate)} — OPG ${r.opg}${r.dewormingDate ? ' · vermifugado' : ''}</li>`).join('')
    : '<li>Nenhum registro clínico/parasitológico.</li>';

  openModal({
    title: horse.name,
    submitLabel: 'Salvar alterações',
    bodyHtml: `
      ${horseFormBody(horse)}
      <div class="field">
        <label>Últimos registros de OPG</label>
        <ul style="margin:4px 0 0; padding-left:18px; font-size:12.5px; color:var(--text-secondary);">${recordsHtml}</ul>
      </div>
      <div class="field">
        <label>Protocolos vinculados</label>
        <p style="margin:2px 0 0; font-size:12.5px; color:var(--text-secondary);">${protocols.length} protocolo(s) cadastrado(s).</p>
      </div>
      <div class="modal-actions" style="justify-content:space-between; margin-top:6px;">
        <button type="button" class="btn btn-danger btn-sm" id="btn-delete-horse">Excluir equino</button>
      </div>
    `,
    onMount: (form) => {
      form.querySelector('#btn-delete-horse').addEventListener('click', () => {
        if (!confirmDialog(`Excluir "${horse.name}" e todos os seus registros/protocolos?`)) return;
        DB.horses.remove(horse.id);
        DB.records.removeWhere((r) => r.horse === horse.id);
        DB.protocols.removeWhere((p) => p.horse === horse.id);
        document.getElementById('modal-host').innerHTML = '';
        toast('Equino excluído.');
        renderAll();
      });
    },
    onSubmit: (form) => {
      const data = readHorseForm(form);
      if (!data.name) { toast('Informe o nome do equino.', 'error'); return false; }
      DB.horses.update(horse.id, data);
      toast('Dados do equino atualizados.');
      renderAll();
    }
  });
}

function initHorsesView() {
  document.getElementById('btn-new-horse').addEventListener('click', openNewHorseModal);
}
