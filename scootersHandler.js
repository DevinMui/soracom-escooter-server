'use strict';

const fs = require('fs');
const certFile = fs.readFileSync('./rds-combined-ca-bundle.pem');

const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const options = {
  sslCA: certFile,
  useNewUrlParser: true
};

mongoose.connect(url,options);

var Scooter = require('./models/scooter');

module.exports.create = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const scooter = await new Scooter().save();

    return {
      statusCode: 200,
      body: JSON.stringify(
        scooter,
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

module.exports.all = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const scooters = await Scooter.find({});

    return {
      statusCode: 200,
      body: JSON.stringify(
        scooters,
        null,
        4
      ),
    };
  } catch(err){
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

module.exports.update = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let scooter = Scooter.findOne(event.pathParameters.id);
    return {
      statusCode: 200,
      body: JSON.stringify(
        scooter,
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
