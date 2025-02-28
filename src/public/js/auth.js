class Auth {
    constructor() {
        this.loginModal = document.getElementById('login-modal');
        this.registerModal = document.getElementById('register-modal');
        this.loginButton = document.getElementById('login-button');
        this.registerButton = document.getElementById('register-button');
        this.logoutButton = document.getElementById('logout-button');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginError = document.getElementById('login-error');
        this.registerError = document.getElementById('register-error');
        this.closeButtons = document.getElementsByClassName('close');

        this.currentUser = null;
        this.init();
    }

    init() {
        // Modal açma/kapama
        if (this.loginButton) {
            this.loginButton.addEventListener('click', () => this.showModal('login'));
        }
        if (this.registerButton) {
            this.registerButton.addEventListener('click', () => this.showModal('register'));
        }
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => this.logout());
        }

        // Modalları kapatma
        Array.from(this.closeButtons).forEach(button => {
            button.addEventListener('click', () => this.hideModals());
        });

        // Form submit
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Modal dışına tıklama
        window.addEventListener('click', (e) => {
            if (e.target === this.loginModal || e.target === this.registerModal) {
                this.hideModals();
            }
        });

        // Auth durumunu kontrol et
        this.checkAuth();
    }

    showModal(type) {
        if (type === 'login') {
            this.loginModal.style.display = 'block';
        } else {
            this.registerModal.style.display = 'block';
        }
    }

    hideModals() {
        this.loginModal.style.display = 'none';
        this.registerModal.style.display = 'none';
        this.loginError.style.display = 'none';
        this.registerError.style.display = 'none';
        this.loginError.textContent = '';
        this.registerError.textContent = '';
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