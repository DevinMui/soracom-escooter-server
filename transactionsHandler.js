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
const Transaction = require('./models/transaction');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.start = async event => {  

  Scooter.findOne(event.body.scooterId, function(err, scooter){
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
    
    scooter.inUse = true;
    scooter.save(function(){
      
      new Transaction({
        scooterId: scooter._id,
        token: event.body.token,
        start: new Date()
      }).save(function(err, transaction){
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
            transaction,
            null,
            4
          ),
        };
      });

    });
  });
};

module.exports.stop = async event => {

  Transaction.findOne(event.pathParameters.id, function(err, transaction){
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

    Scooter.findOne(transaction.scooterId, function(err, scooter){
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

      scooter.inUse = false;
      scooter.save(function(){

        let min = (new Date() - transaction.start) / 60 / 1000;
        stripe.charges.create({
          amount: 100 + min * scooter.price,
          currency: 'usd',
          source: transaction.token
        }, function(err, charge){
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
              charge,
              null,
              4
            )
          };

        });

      });
      
    });

  });
};
