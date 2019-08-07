'use strict';

const dotenv = require('dotenv');
dotenv.config();

const fs = require('fs');
const certFile = fs.readFileSync('./rds-combined-ca-bundle.pem');

const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const options = {
  sslCA: certFile
};

mongoose.connect(url,options);

const Scooter = require('./models/scooter');

module.exports.create = async event => {
  new Scooter().save(function(err, scooter){
    if(err) return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error: err.toString()
        },
        null,
        4
      )
    };

    return {
      statusCode: 200,
      body: JSON.stringify(
        scooter,
        null,
        4
      );
    }
  });
};

module.exports.all = async event => {
  Scooter.find({}, function(err, scooters){
    if(err) return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error: err.toString()
        },
        null,
        4
      )
    };

    return {
      statusCode: 200,
      body: JSON.stringify(
        scooters,
        null,
        4
      ),
    };
  });
};

module.exports.update = async event => {
  Scooter.findOne(event.pathParameters.id, function(err, scooter){
    if(err) return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error: err.toString()
        },
        null,
        4
      )
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(
        scooter,
        null,
        4
      ),
    };
  });
};
