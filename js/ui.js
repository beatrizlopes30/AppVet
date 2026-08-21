/* ==========================================================================
   EquiVet Manager — Shared UI helpers (toasts, modal, confirm dialog, formatters)
   ========================================================================== */

/* ---------- Formatters / lookups ---------- */

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(`${dateString}T00:00:00`);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('pt-BR');
}

function classifyOPG(opg) {
    if (opg < 200) return { label: 'Baixo', tone: 'success' };
    if (opg < 500) return { label: 'Moderado', tone: 'info' };
    if (opg < 1000) return { label: 'Alto', tone: 'warning' };
    return { label: 'Muito Alto', tone: 'danger' };
}

const PRODUCT_NAMES = {
    ivermectin: 'Ivermectina',
    moxidectin: 'Moxidectina',
    fenbendazole: 'Fenbendazol',
    pyrantel: 'Pirantel'
};

function getProductName(productKey) {
    return PRODUCT_NAMES[productKey] || productKey;
}

const PARASITE_NAMES = {
    strongylus: 'Strongylus spp.',
    cyathostomins: 'Cyathostomins',
    ascarids: 'Ascarídeos',
    oxyuris: 'Oxyuris equi',
    habronema: 'Habronema spp.'
};

function getParasiteName(parasiteKey) {
    return PARASITE_NAMES[parasiteKey] || parasiteKey;
}

const PROTOCOL_TYPE_NAMES = {
    rotational: 'Rotacional',
    strategic: 'Estratégico',
    targeted: 'Direcionado'
};

function getProtocolTypeName(typeKey) {
    return PROTOCOL_TYPE_NAMES[typeKey] || typeKey;
}

/* ---------- Toasts ---------- */

const TOAST_ICONS = {
    success: 'fa-circle-check',
    danger: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i>
        <span>${escapeHtml(message)}</span>
        <button type="button" class="toast-close" aria-label="Fechar notificação"><i class="fas fa-xmark"></i></button>
    `;

    const remove = () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 180);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    container.appendChild(toast);
    setTimeout(remove, 4200);
}

/* ---------- Confirm dialog (replaces native confirm()) ---------- */

function showConfirm({ title = 'Confirmar ação', message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = true }) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirm-overlay');
        overlay.querySelector('#confirm-title').textContent = title;
        overlay.querySelector('#confirm-message').textContent = message;

        const confirmBtn = overlay.querySelector('#confirm-ok-btn');
        const cancelBtn = overlay.querySelector('#confirm-cancel-btn');
        confirmBtn.textContent = confirmLabel;
        cancelBtn.textContent = cancelLabel;
        confirmBtn.className = `btn ${danger ? 'btn-warning' : 'btn-primary'}`;

        const cleanup = (result) => {
            overlay.classList.remove('visible');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlayClick);
            document.removeEventListener('keydown', onKeydown);
            resolve(result);
        };

        const onConfirm = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onOverlayClick = (e) => { if (e.target === overlay) cleanup(false); };
        const onKeydown = (e) => {
            if (e.key === 'Escape') cleanup(false);
            if (e.key === 'Enter') cleanup(true);
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlayClick);
        document.addEventListener('keydown', onKeydown);

        overlay.classList.add('visible');
        confirmBtn.focus();
    });
}

/* ---------- Generic modal open/close ---------- */

function openModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;
    overlay.classList.add('visible');
    const firstInput = overlay.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function closeModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;
    overlay.classList.remove('visible');
}

function setupModalDismissals() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('visible');
        });
        overlay.querySelectorAll('[data-close-modal]').forEach((btn) => {
            btn.addEventListener('click', () => overlay.classList.remove('visible'));
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay.visible').forEach((overlay) => {
            overlay.classList.remove('visible');
        });
    });
}
