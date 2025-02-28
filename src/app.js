const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');
const Score = require('./models/Score');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/memory-game', {
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
        const scores = await Score.find()
            .sort({ level: -1, date: -1 })
            .limit(10);
        res.render('index', { scores });
    } catch (err) {
        console.error('Skor yükleme hatası:', err);
        res.render('index', { scores: [] });
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
                const scores = await Score.find()
                    .sort({ level: -1, date: -1 })
                    .limit(10);

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