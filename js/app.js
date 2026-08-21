/* ==========================================================================
   EquiVet Manager — Application logic
   Sections: Auth, Navigation, Dashboard, Equines, Clinical Data,
             Deworming Alerts, OPG History (+chart), Protocols, Init
   ========================================================================== */

// Must match the nav-collapse breakpoint in css/style.css (@media max-width: 760px).
const NAV_BREAKPOINT = 760;

document.addEventListener('DOMContentLoaded', () => {
    setupModalDismissals();
    setupAuth();
    setupNavigation();
    setupEquineFeature();
    setupClinicalDataFeature();
    setupAlertSettingsFeature();
    setupOPGHistoryFeature();
    setupProtocolFeature();

    if (localStorage.getItem(STORAGE_KEYS.isLoggedIn)) {
        showApp();
    } else {
        showLogin();
    }
});

/* ==========================================================================
   Auth
   ========================================================================== */

function setupAuth() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (username === 'veterinario' && password === 'senha123') {
            loginError.classList.add('hidden');
            localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true');
            loginForm.reset();
            showApp();
        } else {
            loginError.textContent = 'Usuário ou senha incorretos. Use: veterinario / senha123';
            loginError.classList.remove('hidden');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmed = await showConfirm({
            title: 'Sair do sistema',
            message: 'Tem certeza que deseja encerrar a sessão?',
            confirmLabel: 'Sair',
            danger: false
        });
        if (!confirmed) return;

        localStorage.removeItem(STORAGE_KEYS.isLoggedIn);
        closeNavMenu();
        showLogin();
    });
}

function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    renderDashboard();
    renderEquineScreen();
    renderClinicalDataScreen();
    renderDewormingAlertsScreen();
    renderOPGHistoryScreen();
    renderProtocolsScreen();
}

/* ==========================================================================
   Navigation — top nav bar with a plain-flow dropdown on narrow screens,
   plus screen routing
   ========================================================================== */

function setupNavigation() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('topbar-nav');

    // Only real navigation entries (excludes the logout link, which has no data-target).
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const screens = document.querySelectorAll('.screen');

    const screenLoaders = {
        dashboard: renderDashboard,
        'equine-register': renderEquineScreen,
        'clinical-data': renderClinicalDataScreen,
        'deworming-alerts': renderDewormingAlertsScreen,
        'opg-history': renderOPGHistoryScreen,
        'antiparasitic-protocols': renderProtocolsScreen
    };

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            closeNavMenu();

            navLinks.forEach((item) => item.classList.remove('active'));
            link.classList.add('active');

            screens.forEach((screen) => screen.classList.add('hidden'));

            const target = link.getAttribute('data-target');
            const targetScreen = document.getElementById(target);
            if (!targetScreen) return;

            targetScreen.classList.remove('hidden');

            const loader = screenLoaders[target];
            if (loader) loader();
        });
    });

    // Hamburger toggle — just flips the 'open' class; CSS animates the nav's
    // height/opacity while it stays in normal document flow (see style.css).
    hamburgerBtn.addEventListener('click', () => {
        if (navMenu.classList.contains('open')) {
            closeNavMenu();
        } else {
            openNavMenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.classList.contains('open')) return;
        if (navMenu.contains(e.target) || hamburgerBtn.contains(e.target)) return;
        closeNavMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
            closeNavMenu();
        }
    });

    // Above the breakpoint the nav is always a plain horizontal row (CSS
    // default outside the media query) — just keep the toggle's own state
    // tidy so it doesn't reopen stale when the window narrows again later.
    window.addEventListener('resize', () => {
        if (window.innerWidth > NAV_BREAKPOINT) {
            closeNavMenu();
        }
    });

    // Subtle depth cue once the page scrolls under the sticky top bar.
    const topbar = document.getElementById('topbar');
    window.addEventListener('scroll', () => {
        topbar.classList.toggle('is-scrolled', window.scrollY > 4);
    }, { passive: true });
}

function openNavMenu() {
    const navMenu = document.getElementById('topbar-nav');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    navMenu.classList.add('open');
    hamburgerBtn.querySelector('i').className = 'fas fa-xmark';
    hamburgerBtn.setAttribute('aria-expanded', 'true');
}

function closeNavMenu() {
    const navMenu = document.getElementById('topbar-nav');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    navMenu.classList.remove('open');
    hamburgerBtn.querySelector('i').className = 'fas fa-bars';
    hamburgerBtn.setAttribute('aria-expanded', 'false');
}

/* ==========================================================================
   Shared: keep the equine <select> dropdowns in sync across screens
   ========================================================================== */

function populateEquineSelect(selectEl, { includeAllOption = false, placeholder = 'Selecione um equino' } = {}) {
    const previousValue = selectEl.value;
    selectEl.innerHTML = '';

    if (includeAllOption) {
        selectEl.appendChild(new Option('Todos', 'all'));
    } else {
        selectEl.appendChild(new Option(placeholder, ''));
    }

    state.equines.forEach((equine) => {
        selectEl.appendChild(new Option(equine.name, equine.id));
    });

    if ([...selectEl.options].some((opt) => opt.value === previousValue)) {
        selectEl.value = previousValue;
    }
}

function refreshEquineDependentSelects() {
    populateEquineSelect(document.getElementById('clinical-equine'));
    populateEquineSelect(document.getElementById('protocol-equine'));
    populateEquineSelect(document.getElementById('opg-equine-filter'), { includeAllOption: true });
}

/* ==========================================================================
   Dashboard
   ========================================================================== */

function renderDashboard() {
    document.getElementById('total-equines').textContent = state.equines.length;

    const today = new Date();

    const pendingDeworming = state.protocols.filter((p) => new Date(p.nextApplication) <= today).length;
    document.getElementById('pending-deworming').textContent = pendingDeworming;

    const highOPG = state.clinicalData.filter((c) => c.opg > state.alertSettings.opgThreshold).length;
    document.getElementById('high-opg').textContent = highOPG;

    document.getElementById('active-protocols-count').textContent = state.protocols.length;

    renderAlertsList(document.getElementById('recent-alerts'));

    const upcomingTable = document.getElementById('upcoming-deworming');
    upcomingTable.innerHTML = '';

    const upcoming = [...state.protocols].sort((a, b) => new Date(a.nextApplication) - new Date(b.nextApplication));

    upcoming.forEach((protocol) => {
        const equine = state.equines.find((e) => e.id === protocol.equineId);
        if (!equine) return;

        const overdue = new Date(protocol.nextApplication) <= today;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(equine.name)}</td>
            <td>${formatDate(protocol.nextApplication)} ${overdue ? '<span class="badge badge-danger">Atrasada</span>' : ''}</td>
            <td>${escapeHtml(getProductName(protocol.product))}</td>
            <td>
                <button class="btn btn-primary btn-sm" data-action="mark-dewormed" data-id="${protocol.id}">
                    <i class="fas fa-check"></i> Realizada
                </button>
            </td>
        `;
        upcomingTable.appendChild(row);
    });

    if (upcoming.length === 0) {
        upcomingTable.innerHTML = `<tr class="empty-row"><td colspan="4">Nenhuma vermifugação agendada no momento.</td></tr>`;
    }
}

function renderAlertsList(container) {
    container.innerHTML = '';
    const today = new Date();

    state.clinicalData
        .filter((record) => record.opg > state.alertSettings.opgThreshold)
        .forEach((record) => {
            const equine = state.equines.find((e) => e.id === record.equineId);
            if (!equine) return;
            container.insertAdjacentHTML('beforeend', `
                <div class="alert alert-warning">
                    <i class="fas fa-triangle-exclamation"></i>
                    <div><strong>OPG Elevado:</strong> ${escapeHtml(equine.name)} apresentou OPG de ${record.opg} em ${formatDate(record.date)}</div>
                </div>
            `);
        });

    state.protocols
        .filter((protocol) => new Date(protocol.nextApplication) <= today)
        .forEach((protocol) => {
            const equine = state.equines.find((e) => e.id === protocol.equineId);
            if (!equine) return;
            container.insertAdjacentHTML('beforeend', `
                <div class="alert alert-warning">
                    <i class="fas fa-bell"></i>
                    <div><strong>Vermifugação Atrasada:</strong> ${escapeHtml(equine.name)} deveria ter sido vermifugado em ${formatDate(protocol.nextApplication)}</div>
                </div>
            `);
        });

    if (container.children.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-circle-check"></i>
                <div><strong>Sem alertas no momento:</strong> todos os equinos estão com a saúde parasitária em dia.</div>
            </div>
        `;
    }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="mark-dewormed"]');
    if (!btn) return;
    markAsDewormed(btn.dataset.id);
});

function markAsDewormed(protocolId) {
    const protocol = state.protocols.find((p) => p.id === protocolId);
    if (!protocol) return;

    protocol.nextApplication = calculateNextApplication();
    persist('protocols');
    renderDashboard();
    renderProtocolsScreen();
    showToast('Vermifugação registrada com sucesso!', 'success');
}

function calculateNextApplication(fromDate = new Date()) {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + state.alertSettings.dewormingInterval);
    return nextDate.toISOString().split('T')[0];
}

/* ==========================================================================
   Equine registration
   ========================================================================== */

function setupEquineFeature() {
    document.getElementById('equine-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const equine = {
            id: generateId(),
            name: document.getElementById('equine-name').value.trim(),
            registration: document.getElementById('equine-registration').value.trim(),
            breed: document.getElementById('equine-breed').value.trim(),
            age: document.getElementById('equine-age').value ? parseInt(document.getElementById('equine-age').value, 10) : null,
            sex: document.getElementById('equine-sex').value,
            color: document.getElementById('equine-color').value.trim(),
            owner: document.getElementById('equine-owner').value.trim(),
            location: document.getElementById('equine-location').value.trim(),
            createdAt: new Date().toISOString()
        };

        state.equines.push(equine);
        persist('equines');
        renderEquineScreen();
        renderDashboard();
        refreshEquineDependentSelects();
        e.target.reset();
        showToast('Equino cadastrado com sucesso!', 'success');
    });

    document.getElementById('equine-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (editBtn) openEquineEditModal(editBtn.dataset.id);
        if (deleteBtn) deleteEquine(deleteBtn.dataset.id);
    });

    document.getElementById('equine-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-equine-id').value;
        const equine = state.equines.find((eq) => eq.id === id);
        if (!equine) return;

        equine.name = document.getElementById('edit-equine-name').value.trim();
        equine.registration = document.getElementById('edit-equine-registration').value.trim();
        equine.breed = document.getElementById('edit-equine-breed').value.trim();
        equine.age = document.getElementById('edit-equine-age').value ? parseInt(document.getElementById('edit-equine-age').value, 10) : null;
        equine.sex = document.getElementById('edit-equine-sex').value;
        equine.color = document.getElementById('edit-equine-color').value.trim();
        equine.owner = document.getElementById('edit-equine-owner').value.trim();
        equine.location = document.getElementById('edit-equine-location').value.trim();

        persist('equines');
        closeModal('equine-edit-modal');
        renderEquineScreen();
        renderDashboard();
        refreshEquineDependentSelects();
        renderClinicalDataScreen();
        renderOPGHistoryScreen();
        renderProtocolsScreen();
        showToast('Equino atualizado com sucesso!', 'success');
    });
}

function renderEquineScreen() {
    const list = document.getElementById('equine-list');
    list.innerHTML = '';

    state.equines.forEach((equine) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(equine.name)}</td>
            <td>${escapeHtml(equine.registration)}</td>
            <td>${escapeHtml(equine.breed) || '—'}</td>
            <td>${equine.age ?? '—'}</td>
            <td>${escapeHtml(sexLabel(equine.sex))}</td>
            <td class="action-buttons">
                <button class="btn btn-primary btn-sm" data-action="edit" data-id="${equine.id}">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${equine.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        `;
        list.appendChild(row);
    });

    if (state.equines.length === 0) {
        list.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhum equino cadastrado. Use o formulário acima para adicionar o primeiro.</td></tr>`;
    }

    refreshEquineDependentSelects();
}

function sexLabel(sex) {
    return { macho: 'Macho', femea: 'Fêmea', castrado: 'Castrado' }[sex] || '—';
}

function openEquineEditModal(equineId) {
    const equine = state.equines.find((e) => e.id === equineId);
    if (!equine) return;

    document.getElementById('edit-equine-id').value = equine.id;
    document.getElementById('edit-equine-name').value = equine.name;
    document.getElementById('edit-equine-registration').value = equine.registration;
    document.getElementById('edit-equine-breed').value = equine.breed || '';
    document.getElementById('edit-equine-age').value = equine.age ?? '';
    document.getElementById('edit-equine-sex').value = equine.sex || '';
    document.getElementById('edit-equine-color').value = equine.color || '';
    document.getElementById('edit-equine-owner').value = equine.owner || '';
    document.getElementById('edit-equine-location').value = equine.location || '';

    openModal('equine-edit-modal');
}

async function deleteEquine(equineId) {
    const equine = state.equines.find((e) => e.id === equineId);
    if (!equine) return;

    const relatedRecords = state.clinicalData.filter((c) => c.equineId === equineId).length;
    const relatedProtocols = state.protocols.filter((p) => p.equineId === equineId).length;
    const extra = relatedRecords || relatedProtocols
        ? ` Isso também removerá ${relatedRecords} registro(s) clínico(s) e ${relatedProtocols} protocolo(s) associado(s).`
        : '';

    const confirmed = await showConfirm({
        title: 'Excluir equino',
        message: `Tem certeza que deseja excluir "${equine.name}"?${extra}`,
        confirmLabel: 'Excluir'
    });
    if (!confirmed) return;

    state.equines = state.equines.filter((e) => e.id !== equineId);
    state.clinicalData = state.clinicalData.filter((c) => c.equineId !== equineId);
    state.protocols = state.protocols.filter((p) => p.equineId !== equineId);

    persist('equines');
    persist('clinicalData');
    persist('protocols');

    renderEquineScreen();
    renderDashboard();
    renderClinicalDataScreen();
    renderOPGHistoryScreen();
    renderProtocolsScreen();
    showToast('Equino excluído com sucesso.', 'success');
}

/* ==========================================================================
   Clinical data
   ========================================================================== */

function setupClinicalDataFeature() {
    document.getElementById('clinical-data-form').addEventListener('submit', (e) => {
        e.preventDefault();

        if (state.equines.length === 0) {
            showToast('Cadastre um equino antes de registrar dados clínicos.', 'warning');
            return;
        }

        const record = {
            id: generateId(),
            equineId: document.getElementById('clinical-equine').value,
            date: document.getElementById('examination-date').value,
            opg: parseInt(document.getElementById('opg-count').value, 10),
            parasites: Array.from(document.getElementById('parasite-types').selectedOptions).map((o) => o.value),
            notes: document.getElementById('clinical-notes').value.trim(),
            dewormingProduct: document.getElementById('deworming-product').value.trim(),
            dewormingDate: document.getElementById('deworming-date').value
        };

        state.clinicalData.push(record);
        persist('clinicalData');
        renderClinicalDataScreen();
        renderDashboard();
        renderOPGHistoryScreen();
        e.target.reset();
        showToast('Dados clínicos registrados com sucesso!', 'success');
    });

    document.getElementById('clinical-history').addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (editBtn) openClinicalEditModal(editBtn.dataset.id);
        if (deleteBtn) deleteClinicalRecord(deleteBtn.dataset.id);
    });

    document.getElementById('clinical-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-clinical-id').value;
        const record = state.clinicalData.find((c) => c.id === id);
        if (!record) return;

        record.equineId = document.getElementById('edit-clinical-equine').value;
        record.date = document.getElementById('edit-examination-date').value;
        record.opg = parseInt(document.getElementById('edit-opg-count').value, 10);
        record.parasites = Array.from(document.getElementById('edit-parasite-types').selectedOptions).map((o) => o.value);
        record.notes = document.getElementById('edit-clinical-notes').value.trim();
        record.dewormingProduct = document.getElementById('edit-deworming-product').value.trim();
        record.dewormingDate = document.getElementById('edit-deworming-date').value;

        persist('clinicalData');
        closeModal('clinical-edit-modal');
        renderClinicalDataScreen();
        renderDashboard();
        renderOPGHistoryScreen();
        showToast('Registro clínico atualizado com sucesso!', 'success');
    });
}

function renderClinicalDataScreen() {
    populateEquineSelect(document.getElementById('clinical-equine'));

    const history = document.getElementById('clinical-history');
    history.innerHTML = '';

    const sorted = [...state.clinicalData].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach((record) => {
        const equine = state.equines.find((e) => e.id === record.equineId);
        if (!equine) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(equine.name)}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.opg}</td>
            <td>${record.parasites.map((p) => escapeHtml(getParasiteName(p))).join(', ') || '—'}</td>
            <td>${escapeHtml(record.dewormingProduct) || 'N/A'}</td>
            <td class="action-buttons">
                <button class="btn btn-primary btn-sm" data-action="edit" data-id="${record.id}">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${record.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        `;
        history.appendChild(row);
    });

    if (sorted.length === 0) {
        history.innerHTML = `<tr class="empty-row"><td colspan="6">Nenhum registro clínico encontrado. Use o formulário acima para adicionar o primeiro.</td></tr>`;
    }
}

function openClinicalEditModal(recordId) {
    const record = state.clinicalData.find((c) => c.id === recordId);
    if (!record) return;

    populateEquineSelect(document.getElementById('edit-clinical-equine'));
    document.getElementById('edit-clinical-id').value = record.id;
    document.getElementById('edit-clinical-equine').value = record.equineId;
    document.getElementById('edit-examination-date').value = record.date;
    document.getElementById('edit-opg-count').value = record.opg;
    document.getElementById('edit-clinical-notes').value = record.notes || '';
    document.getElementById('edit-deworming-product').value = record.dewormingProduct || '';
    document.getElementById('edit-deworming-date').value = record.dewormingDate || '';

    const parasiteSelect = document.getElementById('edit-parasite-types');
    Array.from(parasiteSelect.options).forEach((opt) => {
        opt.selected = record.parasites.includes(opt.value);
    });

    openModal('clinical-edit-modal');
}

async function deleteClinicalRecord(recordId) {
    const confirmed = await showConfirm({
        title: 'Excluir registro clínico',
        message: 'Tem certeza que deseja excluir este registro clínico?',
        confirmLabel: 'Excluir'
    });
    if (!confirmed) return;

    state.clinicalData = state.clinicalData.filter((c) => c.id !== recordId);
    persist('clinicalData');
    renderClinicalDataScreen();
    renderDashboard();
    renderOPGHistoryScreen();
    showToast('Registro clínico excluído com sucesso.', 'success');
}

/* ==========================================================================
   Deworming alerts / settings
   ========================================================================== */

function setupAlertSettingsFeature() {
    document.getElementById('alert-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();

        state.alertSettings = {
            opgThreshold: parseInt(document.getElementById('opg-threshold').value, 10),
            dewormingInterval: parseInt(document.getElementById('deworming-interval').value, 10),
            email: document.getElementById('alert-email').value.trim()
        };

        persist('alertSettings');
        renderDewormingAlertsScreen();
        renderDashboard();
        showToast('Configurações de alerta salvas com sucesso!', 'success');
    });
}

function renderDewormingAlertsScreen() {
    document.getElementById('opg-threshold').value = state.alertSettings.opgThreshold;
    document.getElementById('deworming-interval').value = state.alertSettings.dewormingInterval;
    document.getElementById('alert-email').value = state.alertSettings.email;

    renderAlertsList(document.getElementById('active-alerts'));
}

/* ==========================================================================
   OPG history — filters + canvas chart
   ========================================================================== */

const CHART_COLORS = ['#106b57', '#dd9440', '#3579b8', '#d34953', '#7a4fc9', '#2f9e6e', '#c9668f'];

let opgFilterState = { equineId: 'all', from: '', to: '' };

function setupOPGHistoryFeature() {
    document.getElementById('apply-opg-filters').addEventListener('click', () => {
        opgFilterState = {
            equineId: document.getElementById('opg-equine-filter').value,
            from: document.getElementById('opg-date-from').value,
            to: document.getElementById('opg-date-to').value
        };
        renderOPGHistoryScreen();
    });

    window.addEventListener('resize', () => {
        const screen = document.getElementById('opg-history');
        if (!screen.classList.contains('hidden')) {
            renderOPGChart(getFilteredOPGRecords());
        }
    });
}

function getFilteredOPGRecords() {
    return state.clinicalData
        .filter((record) => opgFilterState.equineId === 'all' || record.equineId === opgFilterState.equineId)
        .filter((record) => !opgFilterState.from || record.date >= opgFilterState.from)
        .filter((record) => !opgFilterState.to || record.date <= opgFilterState.to)
        .filter((record) => state.equines.some((e) => e.id === record.equineId))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderOPGHistoryScreen() {
    populateEquineSelect(document.getElementById('opg-equine-filter'), { includeAllOption: true });
    document.getElementById('opg-equine-filter').value = opgFilterState.equineId;
    document.getElementById('opg-date-from').value = opgFilterState.from;
    document.getElementById('opg-date-to').value = opgFilterState.to;

    const records = getFilteredOPGRecords();
    const list = document.getElementById('opg-history-list');
    list.innerHTML = '';

    // Previous-record lookup uses the FULL history per equine (not just the filtered slice)
    // so the variation column stays meaningful regardless of active filters.
    const byEquineChrono = {};
    state.equines.forEach((eq) => {
        byEquineChrono[eq.id] = state.clinicalData
            .filter((r) => r.equineId === eq.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    [...records].reverse().forEach((record) => {
        const equine = state.equines.find((e) => e.id === record.equineId);
        if (!equine) return;

        const history = byEquineChrono[equine.id];
        const idx = history.findIndex((r) => r.id === record.id);
        const previous = idx > 0 ? history[idx - 1] : null;

        let variationHtml = '<span class="badge badge-muted">Primeiro exame</span>';
        if (previous) {
            const delta = record.opg - previous.opg;
            if (delta > 0) {
                variationHtml = `<span class="badge badge-danger"><i class="fas fa-arrow-up"></i> +${delta}</span>`;
            } else if (delta < 0) {
                variationHtml = `<span class="badge badge-success"><i class="fas fa-arrow-down"></i> ${delta}</span>`;
            } else {
                variationHtml = `<span class="badge badge-muted"><i class="fas fa-equals"></i> 0</span>`;
            }
        }

        const classification = classifyOPG(record.opg);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(equine.name)}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.opg}</td>
            <td><span class="badge badge-${classification.tone}">${classification.label}</span></td>
            <td>${variationHtml}</td>
        `;
        list.appendChild(row);
    });

    if (records.length === 0) {
        list.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhum registro encontrado para os filtros selecionados.</td></tr>`;
    }

    renderOPGChart(records);
}

function renderOPGChart(records) {
    const canvas = document.getElementById('opgChartCanvas');
    const wrapper = canvas.parentElement;
    const legend = document.getElementById('opg-chart-legend');
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    legend.innerHTML = '';

    if (records.length === 0) {
        ctx.fillStyle = '#93a29c';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado disponível para o período selecionado.', width / 2, height / 2);
        return;
    }

    const padding = { top: 18, right: 20, bottom: 34, left: 48 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const byEquine = {};
    records.forEach((r) => {
        if (!byEquine[r.equineId]) byEquine[r.equineId] = [];
        byEquine[r.equineId].push(r);
    });

    const allDates = records.map((r) => new Date(r.date).getTime());
    const allOpg = records.map((r) => r.opg);
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    const maxOpg = Math.max(...allOpg, state.alertSettings.opgThreshold) * 1.15;

    const xFor = (dateStr) => {
        if (maxDate === minDate) return padding.left + plotW / 2;
        return padding.left + ((new Date(dateStr).getTime() - minDate) / (maxDate - minDate)) * plotW;
    };
    const yFor = (opg) => padding.top + plotH - (opg / maxOpg) * plotH;

    // Grid + Y axis labels.
    ctx.strokeStyle = '#e2e8e5';
    ctx.fillStyle = '#62766e';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
        const value = Math.round((maxOpg / ySteps) * i);
        const y = yFor(value);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(String(value), padding.left - 8, y + 4);
    }

    // Threshold line.
    const thresholdY = yFor(state.alertSettings.opgThreshold);
    ctx.save();
    ctx.strokeStyle = '#d34953';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, thresholdY);
    ctx.lineTo(width - padding.right, thresholdY);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#d34953';
    ctx.textAlign = 'left';
    ctx.fillText(`Limite (${state.alertSettings.opgThreshold})`, padding.left + 4, thresholdY - 6);

    // X axis labels (first / last date).
    ctx.fillStyle = '#62766e';
    ctx.textAlign = 'left';
    ctx.fillText(formatDate(new Date(minDate).toISOString().split('T')[0]), padding.left, height - 10);
    ctx.textAlign = 'right';
    ctx.fillText(formatDate(new Date(maxDate).toISOString().split('T')[0]), width - padding.right, height - 10);

    // One line per equine.
    Object.keys(byEquine).forEach((equineId, index) => {
        const equine = state.equines.find((e) => e.id === equineId);
        if (!equine) return;
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const points = byEquine[equineId].sort((a, b) => new Date(a.date) - new Date(b.date));

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
            const x = xFor(p.date);
            const y = yFor(p.opg);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = color;
        points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(xFor(p.date), yFor(p.opg), 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        legend.insertAdjacentHTML('beforeend', `
            <span class="legend-item">
                <span class="legend-swatch" style="background:${color}"></span>${escapeHtml(equine.name)}
            </span>
        `);
    });
}

/* ==========================================================================
   Antiparasitic protocols
   ========================================================================== */

function setupProtocolFeature() {
    document.getElementById('protocol-suggestion-form').addEventListener('submit', (e) => {
        e.preventDefault();

        if (state.equines.length === 0) {
            showToast('Cadastre um equino antes de criar um protocolo.', 'warning');
            return;
        }

        const protocol = {
            id: generateId(),
            equineId: document.getElementById('protocol-equine').value,
            type: document.getElementById('protocol-type').value,
            product: document.getElementById('protocol-product').value,
            dosage: document.getElementById('protocol-dosage').value.trim(),
            frequency: document.getElementById('protocol-frequency').value.trim(),
            notes: document.getElementById('protocol-notes').value.trim(),
            createdAt: new Date().toISOString(),
            nextApplication: calculateNextApplication()
        };

        state.protocols.push(protocol);
        persist('protocols');
        renderProtocolsScreen();
        renderDashboard();
        e.target.reset();
        showToast('Protocolo salvo com sucesso!', 'success');
    });

    document.getElementById('active-protocols').addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (editBtn) openProtocolEditModal(editBtn.dataset.id);
        if (deleteBtn) deleteProtocol(deleteBtn.dataset.id);
    });

    document.getElementById('protocol-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-protocol-id').value;
        const protocol = state.protocols.find((p) => p.id === id);
        if (!protocol) return;

        protocol.equineId = document.getElementById('edit-protocol-equine').value;
        protocol.type = document.getElementById('edit-protocol-type').value;
        protocol.product = document.getElementById('edit-protocol-product').value;
        protocol.dosage = document.getElementById('edit-protocol-dosage').value.trim();
        protocol.frequency = document.getElementById('edit-protocol-frequency').value.trim();
        protocol.notes = document.getElementById('edit-protocol-notes').value.trim();
        protocol.nextApplication = document.getElementById('edit-protocol-next-application').value;

        persist('protocols');
        closeModal('protocol-edit-modal');
        renderProtocolsScreen();
        renderDashboard();
        showToast('Protocolo atualizado com sucesso!', 'success');
    });
}

function renderProtocolsScreen() {
    populateEquineSelect(document.getElementById('protocol-equine'));

    const recommendations = document.getElementById('protocol-recommendations');
    recommendations.innerHTML = '';

    if (state.clinicalData.length > 0) {
        const highOPGRecords = state.clinicalData.filter((r) => r.opg > 500);
        if (highOPGRecords.length > 0) {
            recommendations.insertAdjacentHTML('beforeend', `
                <div class="alert alert-warning">
                    <i class="fas fa-triangle-exclamation"></i>
                    <div>
                        <h5>Recomendação: Protocolo de Controle Intensivo</h5>
                        <p>${highOPGRecords.length} equino(s) apresentaram OPG acima de 500. Recomenda-se protocolo de controle intensivo com moxidectina ou ivermectina + praziquantel.</p>
                    </div>
                </div>
            `);
        }

        const lowOPGRecords = state.clinicalData.filter((r) => r.opg < 200);
        if (lowOPGRecords.length > 0) {
            recommendations.insertAdjacentHTML('beforeend', `
                <div class="alert alert-success">
                    <i class="fas fa-circle-check"></i>
                    <div>
                        <h5>Recomendação: Manutenção</h5>
                        <p>${lowOPGRecords.length} equino(s) apresentaram OPG baixo. Pode-se considerar protocolo de manutenção com rotação estratégica de antiparasitários.</p>
                    </div>
                </div>
            `);
        }
    }

    if (recommendations.children.length === 0) {
        recommendations.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-circle-info"></i>
                <div>Registre dados clínicos para receber recomendações de protocolo baseadas em OPG.</div>
            </div>
        `;
    }

    const table = document.getElementById('active-protocols');
    table.innerHTML = '';

    const sorted = [...state.protocols].sort((a, b) => new Date(a.nextApplication) - new Date(b.nextApplication));

    sorted.forEach((protocol) => {
        const equine = state.equines.find((e) => e.id === protocol.equineId);
        if (!equine) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(equine.name)}</td>
            <td>${escapeHtml(getProtocolTypeName(protocol.type))}</td>
            <td>${escapeHtml(getProductName(protocol.product))}</td>
            <td>${formatDate(protocol.nextApplication)}</td>
            <td class="action-buttons">
                <button class="btn btn-primary btn-sm" data-action="edit" data-id="${protocol.id}">
                    <i class="fas fa-pen"></i> Editar
                </button>
                <button class="btn btn-secondary btn-sm" data-action="delete" data-id="${protocol.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        `;
        table.appendChild(row);
    });

    if (sorted.length === 0) {
        table.innerHTML = `<tr class="empty-row"><td colspan="5">Nenhum protocolo ativo. Use o formulário acima para adicionar o primeiro.</td></tr>`;
    }
}

function openProtocolEditModal(protocolId) {
    const protocol = state.protocols.find((p) => p.id === protocolId);
    if (!protocol) return;

    populateEquineSelect(document.getElementById('edit-protocol-equine'));
    document.getElementById('edit-protocol-id').value = protocol.id;
    document.getElementById('edit-protocol-equine').value = protocol.equineId;
    document.getElementById('edit-protocol-type').value = protocol.type;
    document.getElementById('edit-protocol-product').value = protocol.product;
    document.getElementById('edit-protocol-dosage').value = protocol.dosage || '';
    document.getElementById('edit-protocol-frequency').value = protocol.frequency || '';
    document.getElementById('edit-protocol-notes').value = protocol.notes || '';
    document.getElementById('edit-protocol-next-application').value = protocol.nextApplication || '';

    openModal('protocol-edit-modal');
}

async function deleteProtocol(protocolId) {
    const confirmed = await showConfirm({
        title: 'Excluir protocolo',
        message: 'Tem certeza que deseja excluir este protocolo?',
        confirmLabel: 'Excluir'
    });
    if (!confirmed) return;

    state.protocols = state.protocols.filter((p) => p.id !== protocolId);
    persist('protocols');
    renderProtocolsScreen();
    renderDashboard();
    showToast('Protocolo excluído com sucesso.', 'success');
}
