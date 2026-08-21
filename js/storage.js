/* ==========================================================================
   EquiVet Manager — Data layer (localStorage persistence + seed data)
   ========================================================================== */

const STORAGE_KEYS = {
    equines: 'equines',
    clinicalData: 'clinicalData',
    protocols: 'protocols',
    alertSettings: 'alertSettings',
    isLoggedIn: 'isLoggedIn'
};

const DEFAULT_EQUINES = [
    {
        id: '1',
        name: 'Pé de Pano',
        registration: 'EQ001',
        breed: 'Quarto de Milha',
        age: 5,
        sex: 'macho',
        color: 'Alazão',
        owner: 'Fazenda Boa Esperança',
        location: 'Estábulo A',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Estrela Cadente',
        registration: 'EQ002',
        breed: 'Mangalarga',
        age: 7,
        sex: 'femea',
        color: 'Tordilha',
        owner: 'Haras Santa Fé',
        location: 'Estábulo B',
        createdAt: new Date().toISOString()
    }
];

const DEFAULT_CLINICAL_DATA = [
    {
        id: '1',
        equineId: '1',
        date: '2023-10-15',
        opg: 650,
        parasites: ['strongylus', 'cyathostomins'],
        notes: 'Equino apresentando boa condição corporal',
        dewormingProduct: 'Ivermectina',
        dewormingDate: '2023-10-15'
    },
    {
        id: '2',
        equineId: '2',
        date: '2023-10-10',
        opg: 250,
        parasites: ['cyathostomins'],
        notes: 'Controle parasitário adequado',
        dewormingProduct: 'Moxidectina',
        dewormingDate: '2023-10-10'
    }
];

const DEFAULT_PROTOCOLS = [
    {
        id: '1',
        equineId: '1',
        type: 'targeted',
        product: 'ivermectin',
        dosage: '0.2 mg/kg',
        frequency: 'A cada 60 dias',
        notes: 'Monitorar OPG mensalmente',
        createdAt: new Date().toISOString(),
        nextApplication: '2023-12-15'
    }
];

const DEFAULT_ALERT_SETTINGS = {
    opgThreshold: 500,
    dewormingInterval: 90,
    email: 'veterinario@clinica.com'
};

function loadData(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        console.error(`Falha ao carregar "${key}" do armazenamento local:`, err);
        return fallback;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Application state — hydrated from localStorage, with seed data as fallback.
const state = {
    equines: loadData(STORAGE_KEYS.equines, DEFAULT_EQUINES),
    clinicalData: loadData(STORAGE_KEYS.clinicalData, DEFAULT_CLINICAL_DATA),
    protocols: loadData(STORAGE_KEYS.protocols, DEFAULT_PROTOCOLS),
    alertSettings: loadData(STORAGE_KEYS.alertSettings, DEFAULT_ALERT_SETTINGS)
};

function persist(key) {
    saveData(STORAGE_KEYS[key], state[key]);
}
