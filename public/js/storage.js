// Camada de dados local (localStorage). Substitui a API/MongoDB nesta etapa
// somente-frontend, mas mantém o mesmo formato de registros do relatório do projeto.

const STORAGE_KEYS = {
  users: 'appvet_users',
  session: 'appvet_session',
  horses: 'appvet_horses',
  records: 'appvet_records',
  protocols: 'appvet_protocols'
};

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function newId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function makeCollection(key) {
  return {
    all() {
      return readList(key);
    },
    get(id) {
      return readList(key).find((item) => item.id === id) || null;
    },
    query(predicate) {
      return readList(key).filter(predicate);
    },
    create(data) {
      const list = readList(key);
      const item = { id: newId(), createdAt: new Date().toISOString(), ...data };
      list.push(item);
      writeList(key, list);
      return item;
    },
    update(id, patch) {
      const list = readList(key);
      const idx = list.findIndex((item) => item.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
      writeList(key, list);
      return list[idx];
    },
    remove(id) {
      const list = readList(key);
      const next = list.filter((item) => item.id !== id);
      writeList(key, next);
      return next.length !== list.length;
    },
    removeWhere(predicate) {
      const list = readList(key);
      const next = list.filter((item) => !predicate(item));
      writeList(key, next);
    }
  };
}

const DB = {
  users: makeCollection(STORAGE_KEYS.users),
  horses: makeCollection(STORAGE_KEYS.horses),
  records: makeCollection(STORAGE_KEYS.records),
  protocols: makeCollection(STORAGE_KEYS.protocols),

  session: {
    get() {
      const raw = localStorage.getItem(STORAGE_KEYS.session);
      return raw ? JSON.parse(raw) : null;
    },
    set(userId) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId }));
    },
    clear() {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  },

  currentUser() {
    const session = DB.session.get();
    if (!session) return null;
    return DB.users.get(session.userId);
  },

  findUserByEmail(email) {
    return DB.users.query((u) => u.email.toLowerCase() === email.toLowerCase())[0] || null;
  },

  seedDemoData(userId) {
    const existing = DB.horses.all();
    if (existing.length > 0) return;

    const horseSeeds = [
      { name: 'Pé de Pano', registrationNumber: 'EQ-001', breed: 'Quarto de Milha', age: 8, sex: 'Castrado', coat: 'Alazão', owner: 'Fazenda Santa Rita', location: 'Baia 3', opgThreshold: 500, dewormingIntervalDays: 90 },
      { name: 'Estrela', registrationNumber: 'EQ-002', breed: 'Mangalarga', age: 5, sex: 'Femea', coat: 'Baio', owner: 'Haras Bela Vista', location: 'Baia 7', opgThreshold: 400, dewormingIntervalDays: 90 },
      { name: 'Trovão', registrationNumber: 'EQ-003', breed: 'Crioulo', age: 11, sex: 'Macho', coat: 'Tordilho', owner: 'Sítio Boa Esperança', location: 'Piquete 2', opgThreshold: 600, dewormingIntervalDays: 60 }
    ];

    const horses = horseSeeds.map((h) => DB.horses.create({ ...h, createdBy: userId }));

    const today = new Date();
    const daysAgo = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10);
    };

    DB.records.create({ horse: horses[0].id, examDate: daysAgo(120), opg: 350, parasites: 'Strongylus spp.', clinicalObservations: 'Sem alterações clínicas.', antiparasitic: 'Ivermectina', dewormingDate: daysAgo(120), createdBy: userId });
    DB.records.create({ horse: horses[0].id, examDate: daysAgo(30), opg: 650, parasites: 'Strongylus spp.', clinicalObservations: 'Leve emagrecimento.', antiparasitic: '', dewormingDate: '', createdBy: userId });

    DB.records.create({ horse: horses[1].id, examDate: daysAgo(90), opg: 150, parasites: 'Parascaris spp.', clinicalObservations: 'Animal hígido.', antiparasitic: 'Fenbendazol', dewormingDate: daysAgo(90), createdBy: userId });
    DB.records.create({ horse: horses[1].id, examDate: daysAgo(10), opg: 220, parasites: 'Parascaris spp.', clinicalObservations: '', antiparasitic: '', dewormingDate: '', createdBy: userId });

    DB.records.create({ horse: horses[2].id, examDate: daysAgo(75), opg: 700, parasites: 'Strongylus spp.', clinicalObservations: 'Diarreia leve.', antiparasitic: 'Moxidectina', dewormingDate: daysAgo(75), createdBy: userId });

    DB.protocols.create({ horse: horses[0].id, protocolType: 'Vermifugação estratégica', product: 'Ivermectina 1%', nextApplicationDate: daysAgo(-30), notes: 'Repetir conforme OPG.', active: true, createdBy: userId });
    DB.protocols.create({ horse: horses[1].id, protocolType: 'Vermifugação de rotina', product: 'Fenbendazol', nextApplicationDate: daysAgo(-60), notes: '', active: true, createdBy: userId });
    DB.protocols.create({ horse: horses[2].id, protocolType: 'Controle de foco', product: 'Moxidectina', nextApplicationDate: daysAgo(-5), notes: 'Monitorar propriedade.', active: true, createdBy: userId });
  }
};
