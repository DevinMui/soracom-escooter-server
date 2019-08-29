# soracom-escooter-server

This repository accompanies the tutorial for building an escooter app using Soracom services (link incoming). You'll need to have completed the steps in the first article (link incoming) to connect to SORACOM Air.

Clone this repository and deploy it on AWS Lambda so the app and scooter can connect.

## Setup

You'll need to setup AWS for serverless and DocumentDB before you deploy this application onto AWS Lambda. For more instructions on how to do that, visit the accompanying article.

1. Set up `serverless.yml`
Edit `serverless.yml` such that you replace the `vpc` key with your own values. 
2. Create `env.yml`
In a text editor of your choice, create a new file called `env.yml`. This will contain key values for our Stripe secret key and DocumentDB endpoint. Make it such that it resembles `env.example.yml`
3. Install modules
`npm install`
4. Deploy your functions
`sls deploy`
This command will deploy your functions onto AWS Lambda. Once it's finished, it will spit out a list of endpoints corresponding to your functions.

__Congratulations!__ Your AWS Lambda functions are ready.
