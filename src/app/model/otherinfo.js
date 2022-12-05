'use strict';
const mongoose = require('mongoose');
const otherinfoSchema = new mongoose.Schema({
    matchScore: {
        type: String
    },
    privacyPolicy: {
        type: String
    },
    tandc: {
        type: String
    },
}, {
    timestamps: true
});

otherinfoSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Otherinfo', otherinfoSchema);
