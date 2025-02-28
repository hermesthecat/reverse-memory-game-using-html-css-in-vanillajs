require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Score = require('./models/Score');
const authController = require('./controllers/authController');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB bağlantısı başarılı');
}).catch(err => {
    console.error('MongoDB bağlantı hatası:', err);
});

// Session ayarları
app.use(session({
    secret: process.env.SESSION_SECRET || 'gizli-anahtar',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // 14 gün
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 gün
    }
}));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Auth routes
app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);
app.post('/auth/logout', authController.logout);
app.get('/auth/check', authController.checkAuth);

// Routes
app.get('/', async (req, res) => {
    try {
        const gridSize = parseInt(req.query.gridSize) || 4;
        const scores = await Score.findByGridSize(gridSize);
        res.render('index', { 
            scores, 
            currentGridSize: gridSize,
            user: req.session.username
        });
    } catch (err) {
        console.error('Skor yükleme hatası:', err);
        res.render('index', { 
            scores: [], 
            currentGridSize: 4,
            user: req.session.username
        });
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
                if (data.userId) {
                    // Oyun bittiğinde skoru kaydet
                    await new Score({
                        level: data.level,
                        gridSize: data.gridSize,
                        user: data.userId,
                        username: data.username
                    }).save();

                    // Yeni skor listesini al
                    const scores = await Score.findByGridSize(data.gridSize);

                    socket.emit('moveResult', { 
                        success: false,
                        scores: scores
                    });
                } else {
                    socket.emit('moveResult', { 
                        success: false,
                        requireAuth: true
                    });
                }
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