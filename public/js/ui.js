// Utilidades de UI compartilhadas: toasts, modal e formatação.

function toast(message, type = 'info') {
  const host = document.getElementById('toast-host');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function formatDateBR(value) {
  if (!value) return '—';
  const d = new Date(value + (typeof value === 'string' && value.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function openModal({ title, bodyHtml, onMount, onSubmit, submitLabel = 'Salvar' }) {
  const host = document.getElementById('modal-host');
  host.innerHTML = `
    <div class="modal-backdrop" id="active-modal-backdrop">
      <div class="modal">
        <div class="modal-head">
          <h3>${escapeHtml(title)}</h3>
          <button class="modal-close" id="active-modal-close" aria-label="Fechar">&times;</button>
        </div>
        <form id="active-modal-form">
          ${bodyHtml}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="active-modal-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary">${escapeHtml(submitLabel)}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => { host.innerHTML = ''; };
  document.getElementById('active-modal-close').addEventListener('click', close);
  document.getElementById('active-modal-cancel').addEventListener('click', close);
  document.getElementById('active-modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'active-modal-backdrop') close();
  });

  const form = document.getElementById('active-modal-form');
  if (onMount) onMount(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = onSubmit(form);
    if (result !== false) close();
  });

  return { close, form };
}

function confirmDialog(message) {
  return window.confirm(message);
}
