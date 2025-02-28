class Auth {
    constructor() {
        this.loginModal = new bootstrap.Modal(document.getElementById('login-modal'));
        this.registerModal = new bootstrap.Modal(document.getElementById('register-modal'));
        this.loginButton = document.getElementById('login-button');
        this.registerButton = document.getElementById('register-button');
        this.logoutButton = document.getElementById('logout-button');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginError = document.getElementById('login-error');
        this.registerError = document.getElementById('register-error');

        this.currentUser = null;
        this.init();
    }

    init() {
        if (this.loginButton) {
            this.loginButton.addEventListener('click', () => this.showModal('login'));
        }
        if (this.registerButton) {
            this.registerButton.addEventListener('click', () => this.showModal('register'));
        }
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => this.logout());
        }

        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Modal kapatıldığında form ve hata mesajlarını temizle
        document.getElementById('login-modal').addEventListener('hidden.bs.modal', () => {
            this.loginForm.reset();
            this.loginError.style.display = 'none';
            this.loginError.textContent = '';
        });

        document.getElementById('register-modal').addEventListener('hidden.bs.modal', () => {
            this.registerForm.reset();
            this.registerError.style.display = 'none';
            this.registerError.textContent = '';
        });

        this.checkAuth();
    }

    showModal(type) {
        if (type === 'login') {
            this.loginModal.show();
        } else {
            this.registerModal.show();
        }
    }

    hideModals() {
        this.loginModal.hide();
        this.registerModal.hide();
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                this.currentUser = data.username;
                window.location.reload();
            } else {
                this.loginError.style.display = 'block';
                this.loginError.textContent = data.error;
            }
        } catch (err) {
            this.loginError.style.display = 'block';
            this.loginError.textContent = 'Giriş işlemi başarısız';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                this.currentUser = data.username;
                window.location.reload();
            } else {
                this.registerError.style.display = 'block';
                this.registerError.textContent = data.error;
            }
        } catch (err) {
            this.registerError.style.display = 'block';
            this.registerError.textContent = 'Kayıt işlemi başarısız';
        }
    }

    async logout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Çıkış hatası:', err);
        }
    }

    async checkAuth() {
        try {
            const response = await fetch('/auth/check');
            const data = await response.json();
            this.currentUser = data.isAuthenticated ? data.username : null;
            return data.isAuthenticated;
        } catch (err) {
            console.error('Auth kontrolü hatası:', err);
            return false;
        }
    }
}

// Auth instance'ını oluştur
const auth = new Auth();

// Game.js için auth durumunu kontrol etme fonksiyonu
window.isAuthenticated = () => auth.currentUser !== null;
window.getCurrentUser = () => auth.currentUser; 