'use strict';
const mongoose = require('mongoose');
const newsSchema = new mongoose.Schema({
    title: {
        type: String
    },
    date: {
        type: String
    },
    location: {
        type: String
    },
    news: {
        type: String
    },
    img: {
        type: String
    }
}, {
    timestamps: true
});

newsSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('News', newsSchema);
