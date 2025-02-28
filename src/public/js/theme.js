class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = this.themeToggle.querySelector('i');
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        this.init();
    }

    init() {
        // Sayfa yüklendiğinde tema ayarını uygula
        if (this.isDarkMode) {
            document.body.classList.add('dark-theme');
            this.themeIcon.classList.remove('fa-moon');
            this.themeIcon.classList.add('fa-sun');
        }

        // Toggle butonuna tıklama olayını ekle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-theme');
        
        // İkonu değiştir
        if (this.isDarkMode) {
            this.themeIcon.classList.remove('fa-moon');
            this.themeIcon.classList.add('fa-sun');
        } else {
            this.themeIcon.classList.remove('fa-sun');
            this.themeIcon.classList.add('fa-moon');
        }

        // Tercihi localStorage'a kaydet
        localStorage.setItem('darkMode', this.isDarkMode);
    }
}

// Theme manager'ı başlat
const themeManager = new ThemeManager(); 