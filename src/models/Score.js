const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true
    },
    gridSize: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Score', scoreSchema); 