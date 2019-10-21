"use strict";

const fs = require("fs");
const certFile = fs.readFileSync("./rds-combined-ca-bundle.pem");

const mongoose = require("mongoose");
const url = process.env.MONGO_URL;
const options = {
    sslCA: certFile
};

mongoose.connect(url, options);

const Scooter = require("./models/scooter");
const Transaction = require("./models/transaction");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports.all = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const transactions = await Transaction.find({})
            .populate("scooterId")
            .exec();
        return {
            statusCode: 200,
            body: JSON.stringify(transactions, null, 4)
        };
    } catch (err) {
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

module.exports.start = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const body = JSON.parse(event.body);
        let scooter = await Scooter.findOne({ mac: body.mac });
        if (!scooter) throw new Error("scooter not found");

        scooter.inUse = true;
        scooter = await scooter.save();
        let transaction = await new Transaction({
            scooterId: scooter._id,
            token: body.token,
            start: new Date()
        }).save();
        return {
            statusCode: 200,
            body: JSON.stringify(transaction, null, 4)
        };
    } catch (err) {
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

module.exports.stop = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        let transaction = await Transaction.findById(event.pathParameters.id);
        let scooter = await Scooter.findById(transaction.scooterId);

        if (!transaction) throw new Error("transaction not found");
        if (!scooter) throw new Error("scooter not found");

        let min = (new Date() - new Date(transaction.start)) / 60 / 1000;
        let charge = await stripe.charges.create({
            amount: Math.ceil(100 + min * scooter.price),
            currency: "usd",
            source: transaction.token
        });

        scooter.inUse = false;
        scooter = await scooter.save();

        return {
            statusCode: 200,
            body: JSON.stringify(charge, null, 4)
        };
    } catch (err) {
        console.log(err);
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
