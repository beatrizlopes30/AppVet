// Autenticação local (sem backend nesta etapa): cadastro/login de veterinários
// armazenados em localStorage. Sem criptografia real de senha, pois os dados
// nunca saem do navegador.

function showAuthError(message) {
  const box = document.getElementById('auth-error');
  box.textContent = message;
  box.classList.remove('hidden');
}

function clearAuthError() {
  document.getElementById('auth-error').classList.add('hidden');
}

function initAuthScreen() {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const btnShowRegister = document.getElementById('btn-show-register');
  const btnShowLogin = document.getElementById('btn-show-login');
  const switchHint = document.getElementById('auth-switch-login-hint');

  btnShowRegister.addEventListener('click', () => {
    clearAuthError();
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
    btnShowRegister.classList.add('hidden');
    btnShowLogin.classList.remove('hidden');
    switchHint.textContent = 'Já tem conta?';
  });

  btnShowLogin.addEventListener('click', () => {
    clearAuthError();
    formRegister.classList.add('hidden');
    formLogin.classList.remove('hidden');
    btnShowLogin.classList.add('hidden');
    btnShowRegister.classList.remove('hidden');
    switchHint.textContent = 'Ainda não tem conta?';
  });

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAuthError();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const user = DB.findUserByEmail(email);
    if (!user || user.password !== password) {
      showAuthError('Credenciais inválidas.');
      return;
    }

    DB.session.set(user.id);
    enterApp();
  });

  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAuthError();
    const name = document.getElementById('reg-name').value.trim();
    const crmv = document.getElementById('reg-crmv').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
      showAuthError('Preencha nome, e-mail e senha.');
      return;
    }
    if (DB.findUserByEmail(email)) {
      showAuthError('Já existe uma conta com este e-mail.');
      return;
    }

    const user = DB.users.create({ name, email, password, crmv });
    DB.session.set(user.id);
    DB.seedDemoData(user.id);
    enterApp();
  });
}

function logout() {
  DB.session.clear();
  document.getElementById('screen-app').classList.add('hidden');
  document.getElementById('screen-auth').classList.remove('hidden');
  document.getElementById('form-login').reset();
}

function enterApp() {
  const user = DB.currentUser();
  if (!user) return;

  document.getElementById('screen-auth').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('hidden');
  document.getElementById('sidebar-user-name').textContent = user.name;
  document.getElementById('sidebar-user-email').textContent = user.email;

  renderAll();
}
