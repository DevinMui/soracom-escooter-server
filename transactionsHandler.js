'use strict';

const fs = require('fs');
const certFile = fs.readFileSync('./rds-combined-ca-bundle.pem');

const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const options = {
  sslCA: certFile
};

mongoose.connect(url,options);

const Scooter = require('./models/scooter');
const Transaction = require('./models/transaction');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.start = async (event, context) => {  
  try {
    let scooter = await Scooter.findOne(event.body.scooterId);
    scooter.inUse = true;
    scooter = await scooter.save();
    let transaction = await new Transaction({
      scooterId: scooter._id,
      token: event.body.token,
      start: new Date()
    }).save();
    return {
      statusCode: 200,
      body: JSON.stringify(
        transaction,
        null,
        4
      ),
    };
  } catch(err) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error: err.toString()
        },
        null,
        4
      )
    };
  }
};

module.exports.stop = async event => {
  try {
    let transaction = await Transaction.findOne(event.pathParameters.id);
    let scooter = await Scooter.findOne(transaction.scooterId);

    scooter.inUse = false;
    scooter = await scooter.save();

    let min = (new Date() - transaction.start) / 60 / 1000;
    let charge = await stripe.charges.create({
      amount: 100 + min * scooter.price,
      currency: 'usd',
      source: transaction.token
    });
    return {
      statusCode: 200,
      body: JSON.stringify(
        charge,
        null,
        4
      )
    };
  } catch(err) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error: err.toString()
        },
        null,
        4
      )
    };
  }
};
