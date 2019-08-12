'use strict';

const fs = require('fs');
const certFile = fs.readFileSync('./rds-combined-ca-bundle.pem');

const geolocation = require('geolocation-utils');
const mongoose = require('mongoose');
const url = process.env.MONGO_URL;
const options = {
    sslCA: certFile,
    useNewUrlParser: true
};

mongoose.connect(url,options);

var Scooter = require('./models/scooter');

module.exports.createOrUpdate = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const scooter = await Scooter.findOne({ mac: event.body.mac });
        
        // calculate surge price based on gps
        const inUseScooters = await Scooter.find({ inUse: true });

        defaultPriceInCents = 15; // cents
        priceHikePerScooterInCents = 1; // 1 cent
        distanceToleranceInMeters = 1600; // roughly a mile
        scooterCount = 0;
        for(inUseScooter of inUseScooters){
            if(geolocation.distanceTo(
                {
                    lat: event.body.coords.lat,
                    lon: event.body.coords.lng
                },
                {
                    lat: inUseScooter.coords.lat,
                    lon: inUseScooter.coords.lng
                }
            ) < distanceToleranceInMeters)
                scooterCount++;
        }

        // update
        if(scooter){
            scooter.coords = event.body.coords || scooter.coords;
            scooter.battery = event.body.battery || scooter.battery;
            scooter.speed = event.body.speed || scooter.speed;
            scooter.price = defaultPriceInCents + priceHikePerScooterInCents*scooterCount;
            await scooter.save();
            return {
                statusCode: 200,
                body: JSON.stringify(
                    scooter,
                    null,
                    4
                )
            };
        }
        // create
        const scooter = await new Scooter({
            mac: event.body.mac,
            coords: event.body.coords,
            battery: event.body.battery,
            speed: event.body.speed,
            price: defaultPriceInCents + priceHikePerScooterInCents*scooterCount
        }).save();

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
        const scooters = await Scooter.find({ inUse: false });

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
