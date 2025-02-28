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
    date: {
        type: Date,
        default: Date.now
    }
});

scoreSchema.statics.findByGridSize = function(gridSize) {
    return this.find({ gridSize })
        .sort({ level: -1, date: -1 })
        .limit(10);
};

module.exports = mongoose.model('Score', scoreSchema); 