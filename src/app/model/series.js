'use strict';
const mongoose = require('mongoose');
const seriesSchema = new mongoose.Schema({
    seriesName: {
        type: String
    },
    seriesImg: {
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
}, {
    timestamps: true
});

seriesSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Series', seriesSchema);
