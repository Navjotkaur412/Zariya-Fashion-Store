/* Login / register modal logic. Stores a JWT from the backend in
   localStorage on success. Falls back to a friendly offline message if the
   backend/MongoDB is not running, since auth genuinely requires the API. */

const AN_auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('an_user'));
    } catch {
      return null;
    }
  },

  setSession(user, token) {
    localStorage.setItem('an_user', JSON.stringify(user));
    localStorage.setItem('an_token', token);
    document.dispatchEvent(new CustomEvent('an:auth-updated'));
  },

  logout() {
    localStorage.removeItem('an_user');
    localStorage.removeItem('an_token');
    document.dispatchEvent(new CustomEvent('an:auth-updated'));
  },

  init() {
    const form = document.getElementById('authForm');
    const feedback = document.getElementById('authFeedback');
    const toggleBtn = document.getElementById('authToggleMode');
    const submitBtn = document.getElementById('authSubmitBtn');
    const nameField = document.getElementById('authNameField');
    const title = document.getElementById('authModalTitle');
    let mode = 'login';

    const setMode = (next) => {
      mode = next;
      const isLogin = mode === 'login';
      title.textContent = isLogin ? 'Log in' : 'Create an account';
      submitBtn.textContent = isLogin ? 'Log in' : 'Create account';
      toggleBtn.textContent = isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in';
      nameField.classList.toggle('d-none', isLogin);
      feedback.textContent = '';
    };

    toggleBtn?.addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedback.textContent = '';
      feedback.className = 'small mt-2';

      const name = document.getElementById('authName').value.trim();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait…';

      try {
        const data = mode === 'login' ? await AN_api.login(email, password) : await AN_api.register(name, email, password);
        this.setSession(data.user, data.token);
        feedback.classList.add('text-success');
        feedback.textContent = `Welcome, ${data.user.name.split(' ')[0]}.`;
        setTimeout(() => {
          bootstrap.Modal.getInstance(document.getElementById('authModal'))?.hide();
          AN_ui.showToast(`Signed in as ${data.user.name}`);
        }, 600);
      } catch (err) {
        feedback.classList.add('text-danger');
        feedback.textContent = err.message.includes('fetch') || err.message.includes('Failed')
          ? 'The account service is offline right now. Start the backend to enable accounts.'
          : err.message;
      } finally {
        submitBtn.disabled = false;
        setMode(mode);
      }
    });

    setMode('login');
    this.reflectAuthState();
    document.addEventListener('an:auth-updated', () => this.reflectAuthState());
  },

  reflectAuthState() {
    const user = this.getUser();
    const loginLink = document.getElementById('navLoginLink');
    if (!loginLink) return;
    if (user) {
      loginLink.textContent = user.name.split(' ')[0];
      loginLink.dataset.bsToggle = '';
      loginLink.removeAttribute('data-bs-toggle');
      loginLink.removeAttribute('data-bs-target');
      loginLink.onclick = (e) => {
        e.preventDefault();
        if (confirm('Log out of your account?')) this.logout();
      };
    } else {
      loginLink.textContent = 'Login';
      loginLink.setAttribute('data-bs-toggle', 'modal');
      loginLink.setAttribute('data-bs-target', '#authModal');
      loginLink.onclick = null;
    }
  },
};
