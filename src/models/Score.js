const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true
    },
    gridSize: {
        type: Number,
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

scoreSchema.statics.findByGridSize = function(gridSize) {
    return this.find({ gridSize })
        .sort({ level: -1, date: -1 })
        .limit(15);
};

module.exports = mongoose.model('Score', scoreSchema); 