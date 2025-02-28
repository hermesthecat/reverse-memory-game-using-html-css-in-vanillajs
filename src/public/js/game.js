const socket = io();

class MemoryGame {
    constructor() {
        this.colors = ['#e57373', '#81c784', '#64b5f6', '#ffd54f', '#ba68c8', '#ff8a65'];
        this.gridSize = parseInt(document.getElementById('grid-size').value);
        this.sequence = [];
        this.userSequence = [];
        this.level = 0;
        this.isPlaying = false;
        this.score = 0;
        this.gameStarted = false;

        this.gridContainer = document.getElementById('grid-container');
        this.startButton = document.getElementById('start-button');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.status = document.getElementById('status');
        this.highScores = document.getElementById('high-scores');
        this.currentGridSizeSpan = document.getElementById('current-grid-size');

        this.init();
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    init() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.createGrid();
            this.updateGridSizeDisplay();
            this.fetchScores();
        });
        this.createGrid();
        this.setupSocketListeners();
    }

    handleResize() {
        this.adjustGridLayout();
    }

    adjustGridLayout() {
        const containerWidth = this.gridContainer.offsetWidth;
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    }

    updateGridSizeDisplay() {
        this.currentGridSizeSpan.textContent = `${this.gridSize}x${this.gridSize}`;
    }

    async fetchScores() {
        try {
            const response = await fetch(`/api/scores/${this.gridSize}`);
            const scores = await response.json();
            this.updateHighScores(scores);
        } catch (err) {
            console.error('Skor yükleme hatası:', err);
        }
    }

    setupSocketListeners() {
        socket.on('gameStarted', (data) => {
            this.status.textContent = 'Oyun başladı!';
            this.gameStarted = true;
            this.level = 0;
            this.sequence = [];
            this.userSequence = [];
            this.score = 0;
            this.createGrid();
            this.generateSequence();
            this.displaySequence();
        });

        socket.on('moveResult', (data) => {
            if (data.success) {
                this.status.textContent = 'Doğru! Sıradaki seviye...';
                setTimeout(() => this.nextLevel(), 1000);
            } else {
                this.status.textContent = `Yanlış! Oyun bitti. Ulaştığınız seviye: ${this.level}`;
                if (data.scores) {
                    this.updateHighScores(data.scores);
                }
                this.endGame(false);
            }
        });
    }

    createGrid() {
        this.gridContainer.innerHTML = '';
        this.adjustGridLayout();
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const square = document.createElement('div');
            square.classList.add('grid-square');
            square.dataset.index = i;
            square.addEventListener('click', () => this.handleSquareClick(i));
            this.gridContainer.appendChild(square);
        }
    }

    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        this.level = 0;
        this.sequence = [];
        this.userSequence = [];
        this.score = 0;
        this.gridSize = parseInt(document.getElementById('grid-size').value);
        this.createGrid();
        this.generateSequence();
        this.displaySequence();
    }

    nextLevel() {
        this.level++;
        this.userSequence = [];
        const randomSquare = Math.floor(Math.random() * this.gridSize * this.gridSize);
        const newColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push({ index: randomSquare, color: newColor });
        this.displaySequence();
    }

    displaySequence() {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= this.sequence.length) {
                clearInterval(interval);
                return;
            }
            const squareData = this.sequence[i];
            const square = this.gridContainer.children[squareData.index];
            this.showColor(square, squareData.color);
            i++;
        }, 1000);
    }

    showColor(square, color) {
        const originalColor = square.style.backgroundColor;
        square.style.backgroundColor = color;
        setTimeout(() => {
            square.style.backgroundColor = originalColor;
        }, 500);
    }

    handleSquareClick(index) {
        if (!this.gameStarted || this.userSequence.length >= this.sequence.length) return;

        const square = this.gridContainer.children[index];
        const squareData = this.sequence[this.sequence.length - this.userSequence.length - 1];
        
        this.showColor(square, squareData.color);
        this.userSequence.push({ index, color: squareData.color });

        socket.emit('moveSubmitted', {
            userSequence: this.userSequence,
            sequence: this.sequence,
            level: this.level,
            gridSize: this.gridSize
        });
    }

    endGame(success = false) {
        this.gameStarted = false;
        const resultMessage = success 
            ? `Tebrikler! Puanınız: ${this.score}` 
            : `Oyun bitti. Puanınız: ${this.score}`;
        
        this.showGameResult(resultMessage);
        
        if (auth.isLoggedIn()) {
            this.saveScore(this.score);
        }
    }

    showGameResult(message) {
        const overlay = document.getElementById('game-result-overlay');
        const messageEl = document.getElementById('game-result-message');
        messageEl.textContent = message;
        overlay.classList.add('show');
    }

    closeGameResult() {
        const overlay = document.getElementById('game-result-overlay');
        overlay.classList.remove('show');
    }

    generateSequence() {
        const randomSquare = Math.floor(Math.random() * this.gridSize * this.gridSize);
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push({ index: randomSquare, color: randomColor });
    }

    saveScore(score) {
        fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                score: score,
                level: this.level,
                gridSize: this.gridSize
            })
        }).catch(err => console.error('Skor kaydetme hatası:', err));
    }

    updateHighScores(scores) {
        this.highScores.innerHTML = '';
        if (scores.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'henüz skor kaydedilmemiş';
            this.highScores.appendChild(li);
            return;
        }
        scores.forEach(score => {
            const li = document.createElement('li');
            li.textContent = `Seviye ${score.level} - ${new Date(score.date).toLocaleString('tr-TR')}`;
            this.highScores.appendChild(li);
        });
    }
}

// Oyunu başlat
const game = new MemoryGame(); 