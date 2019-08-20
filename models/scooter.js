'use strict';

const mongoose = require('mongoose');

const scooterSchema = mongoose.Schema({
    mac: { type: String, required: true, unique: true },
    coords: {
        lng: { type: Number },
        lat: { type: Number }
    },
    battery: { type: Number },
    speed: { type: Number },
    price: { type: Number, default: 15, min: [1, 'Price cannot be zero'] },
    inUse: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Scooter', scooterSchema);
