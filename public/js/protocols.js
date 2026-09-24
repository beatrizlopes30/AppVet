// Modulo de Protocolos Antiparasitarios: tipo de protocolo, produto utilizado
// e proxima aplicacao, individualizados por equino.

function protocolFormBody(protocol) {
  const p = protocol || {};
  return `
    <div class="field">
      <label>Equino *</label>
      <select name="horse" required>${horseOptionsHtml(p.horse)}</select>
    </div>
    <div class="field">
      <label>Tipo de protocolo *</label>
      <input name="protocolType" value="${escapeHtml(p.protocolType || '')}" placeholder="Ex.: Vermifugação estratégica" required>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Produto *</label>
        <input name="product" value="${escapeHtml(p.product || '')}" required>
      </div>
      <div class="field">
        <label>Próxima aplicação</label>
        <input type="date" name="nextApplicationDate" value="${p.nextApplicationDate ? p.nextApplicationDate.slice(0, 10) : ''}">
      </div>
    </div>
    <div class="field">
      <label>Observações</label>
      <textarea name="notes" rows="2">${escapeHtml(p.notes || '')}</textarea>
    </div>
    <div class="field">
      <label><input type="checkbox" name="active" ${p.active === false ? '' : 'checked'} style="width:auto; margin-right:6px;">Protocolo ativo</label>
    </div>
  `;
}

function readProtocolForm(form) {
  const fd = new FormData(form);
  return {
    horse: fd.get('horse'),
    protocolType: fd.get('protocolType').trim(),
    product: fd.get('product').trim(),
    nextApplicationDate: fd.get('nextApplicationDate') || '',
    notes: fd.get('notes').trim(),
    active: fd.get('active') === 'on'
  };
}

function openNewProtocolModal() {
  if (DB.horses.all().length === 0) {
    toast('Cadastre um equino antes de criar um protocolo.', 'error');
    return;
  }
  openModal({
    title: 'Novo protocolo antiparasitário',
    bodyHtml: protocolFormBody(),
    submitLabel: 'Cadastrar',
    onSubmit: (form) => {
      const data = readProtocolForm(form);
      if (!data.horse || !data.protocolType || !data.product) {
        toast('Preencha equino, tipo de protocolo e produto.', 'error');
        return false;
      }
      const user = DB.currentUser();
      DB.protocols.create({ ...data, createdBy: user.id });
      toast('Protocolo cadastrado.');
      renderAll();
    }
  });
}

function openEditProtocolModal(id) {
  const protocol = DB.protocols.get(id);
  if (!protocol) return;
  openModal({
    title: 'Editar protocolo',
    bodyHtml: protocolFormBody(protocol),
    submitLabel: 'Salvar',
    onSubmit: (form) => {
      const data = readProtocolForm(form);
      DB.protocols.update(id, data);
      toast('Protocolo atualizado.');
      renderAll();
    }
  });
}

function renderProtocolsTable() {
  const tbody = document.getElementById('protocols-tbody');
  const empty = document.getElementById('protocols-empty');
  const horsesById = Object.fromEntries(DB.horses.all().map((h) => [h.id, h]));
  const protocols = DB.protocols.all().sort((a, b) => new Date(a.nextApplicationDate || 0) - new Date(b.nextApplicationDate || 0));

  if (protocols.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = protocols.map((p) => {
    const horse = horsesById[p.horse];
    const overdue = p.nextApplicationDate && p.nextApplicationDate < todayISO();
    return `
      <tr>
        <td>${escapeHtml(horse ? horse.name : '—')}</td>
        <td>${escapeHtml(p.protocolType)}</td>
        <td>${escapeHtml(p.product)}</td>
        <td>${p.nextApplicationDate ? formatDateBR(p.nextApplicationDate) : '—'}</td>
        <td>
          ${p.active ? '<span class="badge ok">Ativo</span>' : '<span class="badge muted">Inativo</span>'}
          ${overdue ? '<span class="badge warn">Vencido</span>' : ''}
        </td>
        <td class="row-actions">
          <button class="btn btn-secondary btn-sm" data-edit="${p.id}">Editar</button>
          <button class="btn btn-danger btn-sm" data-del="${p.id}">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openEditProtocolModal(btn.dataset.edit));
  });
  tbody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirmDialog('Excluir este protocolo?')) return;
      DB.protocols.remove(btn.dataset.del);
      toast('Protocolo excluído.');
      renderAll();
    });
  });
}

function initProtocolsView() {
  document.getElementById('btn-new-protocol').addEventListener('click', openNewProtocolModal);
}
