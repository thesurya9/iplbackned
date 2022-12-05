'use strict';
const mongoose = require('mongoose');
const clientJobSchema = new mongoose.Schema({
    job_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    }
}, {
    timestamps: true
});

clientJobSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('ClientJob', clientJobSchema);
