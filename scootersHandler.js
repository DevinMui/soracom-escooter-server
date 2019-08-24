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

module.exports.getById = async (event, context) => {
    try {
        let scooter = await Scooter.findById( event.pathParameters.id );
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
}

module.exports.clear = async (event, context) => {
    try {
        await Scooter.deleteMany({})
        return { 
            statusCode: 200, 
            body: JSON.stringify(
                { 
                    success: true 
                }, 
                null, 
                4
            )
        };
    }  catch(err) {
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
}

module.exports.createOrUpdate = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const body = event;
        const scooter = await Scooter.findOne({ mac: body.mac });
        
        // calculate surge price based on gps
        const inUseScooters = await Scooter.find({ inUse: true });

        const defaultPriceInCents = 15; // cents
        const priceHikePerScooterInCents = 1; // 1 cent
        const distanceToleranceInMeters = 1600; // roughly a mile
        
        let scooterCount = 0;
        for(var inUseScooter of inUseScooters){
            if(geolocation.distanceTo(
                {
                    lat: body.coords.lat,
                    lon: body.coords.lng
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
            scooter.coords = body.coords || scooter.coords;
            scooter.battery = body.battery || scooter.battery;
            scooter.speed = body.speed || scooter.speed;
            scooter.price = !scooter.inUse ? defaultPriceInCents + priceHikePerScooterInCents*scooterCount : scooter.price;
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
        const newScooter = await new Scooter({
            mac: body.mac,
            coords: body.coords,
            battery: body.battery,
            speed: body.speed,
            price: defaultPriceInCents + priceHikePerScooterInCents*scooterCount
        }).save();

        return {
            statusCode: 200,
            body: JSON.stringify(
                newScooter,
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
