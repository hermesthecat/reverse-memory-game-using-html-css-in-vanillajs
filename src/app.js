require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');
const Score = require('./models/Score');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB bağlantısı başarılı');
}).catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
});

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', async (req, res) => {
    try {
        const gridSize = parseInt(req.query.gridSize) || 4; // Varsayılan 4x4
        const scores = await Score.findByGridSize(gridSize);
        res.render('index', { scores, currentGridSize: gridSize });
    } catch (err) {
        console.error('Skor yükleme hatası:', err);
        res.render('index', { scores: [], currentGridSize: 4 });
    }
});

// API endpoint for scores
app.get('/api/scores/:gridSize', async (req, res) => {
    try {
        const gridSize = parseInt(req.params.gridSize);
        const scores = await Score.findByGridSize(gridSize);
        res.json(scores);
    } catch (err) {
        console.error('Skor yükleme hatası:', err);
        res.status(500).json({ error: 'Skorlar yüklenemedi' });
    }
});

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');

    socket.on('startGame', (data) => {
        socket.emit('gameStarted', { gridSize: data.gridSize });
    });

    socket.on('moveSubmitted', async (data) => {
        const isCorrect = checkSequence(data.userSequence, data.sequence);
        
        if (!isCorrect) {
            try {
                // Oyun bittiğinde skoru kaydet
                await new Score({
                    level: data.level,
                    gridSize: data.gridSize
                }).save();

                // Yeni skor listesini al
                const scores = await Score.findByGridSize(data.gridSize);

                socket.emit('moveResult', { 
                    success: false,
                    scores: scores
                });
            } catch (err) {
                console.error('Skor kaydetme hatası:', err);
                socket.emit('moveResult', { 
                    success: false,
                    scores: []
                });
            }
        } else {
            socket.emit('moveResult', { success: true });
        }
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
    });
});

function checkSequence(userSequence, gameSequence) {
    return userSequence.every((data, index) => 
        data.index === gameSequence[gameSequence.length - 1 - index].index
    );
}

// Server başlatma
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 