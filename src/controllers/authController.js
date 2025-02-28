const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kullanıcı adı kontrolü
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
        }

        // Yeni kullanıcı oluştur
        const user = new User({ username, password });
        await user.save();

        // Session'a kullanıcı bilgisini kaydet
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ success: true, username: user.username });
    } catch (err) {
        console.error('Kayıt hatası:', err);
        res.status(500).json({ error: 'Kayıt işlemi başarısız' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kullanıcıyı bul
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
        }

        // Şifreyi kontrol et
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
        }

        // Session'a kullanıcı bilgisini kaydet
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ success: true, username: user.username });
    } catch (err) {
        console.error('Giriş hatası:', err);
        res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Çıkış hatası:', err);
            return res.status(500).json({ error: 'Çıkış işlemi başarısız' });
        }
        res.json({ success: true });
    });
};

exports.checkAuth = (req, res) => {
    if (req.session.userId) {
        res.json({ 
            isAuthenticated: true, 
            username: req.session.username 
        });
    } else {
        res.json({ isAuthenticated: false });
    }
}; 