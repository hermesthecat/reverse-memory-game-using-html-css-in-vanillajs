const socket = io();

class MemoryGame {
    constructor() {
        this.colors = ['#e57373', '#81c784', '#64b5f6', '#ffd54f', '#ba68c8', '#ff8a65'];
        this.gridSize = parseInt(document.getElementById('grid-size').value);
        this.sequence = [];
        this.userSequence = [];
        this.level = 0;
        this.isPlaying = false;

        this.gridContainer = document.getElementById('grid-container');
        this.startButton = document.getElementById('start-button');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.status = document.getElementById('status');
        this.highScores = document.getElementById('high-scores');
        this.currentGridSizeSpan = document.getElementById('current-grid-size');

        this.init();
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
            this.isPlaying = true;
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
                this.resetGame();
            }
        });
    }

    createGrid() {
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, 100px)`;
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const square = document.createElement('div');
            square.classList.add('grid-square');
            square.dataset.index = i;
            square.addEventListener('click', () => this.handleSquareClick(i));
            this.gridContainer.appendChild(square);
        }
    }

    startGame() {
        this.level = 0;
        this.sequence = [];
        this.userSequence = [];
        this.isPlaying = true;
        socket.emit('startGame', { gridSize: this.gridSize });
        this.nextLevel();
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
        if (!this.isPlaying || this.userSequence.length >= this.sequence.length) return;

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

    resetGame() {
        this.sequence = [];
        this.userSequence = [];
        this.level = 0;
        this.isPlaying = false;
    }

    updateHighScores(scores) {
        this.highScores.innerHTML = '';
        if (scores.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Bu grid boyutu için henüz skor kaydedilmemiş';
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