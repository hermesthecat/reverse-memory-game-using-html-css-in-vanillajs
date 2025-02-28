const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı');

    socket.on('startGame', (data) => {
        socket.emit('gameStarted', { gridSize: data.gridSize });
    });

    socket.on('moveSubmitted', (data) => {
        // Oyun mantığı burada işlenecek
        socket.emit('moveResult', { success: true });
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
    });
});

// Server başlatma
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 