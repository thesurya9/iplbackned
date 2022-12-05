'use strict';
const mongoose = require('mongoose');
const jobInvites = new mongoose.Schema({
    invited: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String, default: 'PENDING', enum: ['REJECTED', 'ACCEPTED', 'PENDING']
    }
}, {
    timestamps: true
});

jobInvites.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('JobInvite', jobInvites);
