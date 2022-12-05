'use strict';
const mongoose = require('mongoose');
const matchSchema = new mongoose.Schema({
    seriesName: {
        type: String
    },
    teamA: {
        type: String
    },
    teamAimg: {
        type: String
    },
    teamB: {
        type: String
    },
    teamBimg: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    location: {
        type: String
    },
    prediction: {
        type: String
    },
    score: {
        type: String
    },
    key: {
        type: String
    },
    matchListArray: [
    ]
}, {
    timestamps: true
});

matchSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Match', matchSchema);
