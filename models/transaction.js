'use strict';

const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
	scooterId: { type: Schema.Types.ObjectId, ref: 'Scooter', required: true },
	token: { type: String, required: true },
	start: { type: Date, required: true },
	end: { type: Date }
});

module.exports = mongoose.model('Transaction', transactionSchema);