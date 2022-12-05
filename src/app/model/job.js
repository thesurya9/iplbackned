'use strict';
const mongoose = require('mongoose');
const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
});

const jobSchema = new mongoose.Schema({
    title: {
        type: String
    },
    amount: {
        type: Number
    },
    description: {
        type: String
    },
    posted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    public: {
        type: Boolean, default: true
    },
    type: {
        type: String
    },
    startDate: {
        type: Date
    },
    person: {
        type: Number
    },
    address: {
        type: String
    },
    endDate: {
        type: Date
    },
    location: {
        type: pointSchema
    },

    applicant: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]

}, {
    timestamps: true
});

jobSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});
jobSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Job', jobSchema);
