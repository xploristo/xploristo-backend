# xploristo-backend

Backend for **Xploristo**, a tool that allows students to acquire skills related to the effective extraction of information from scientific texts. You can find its frontend [here](https://github.com/xploristo/xploristo).

> [!NOTE]  
> This project was created for my (@celiavelmar) Bachelor's Thesis and it was awarded with honors 🥇.

## Configuration

This application receives its configuration from `.env` files by using [dotenv](https://www.npmjs.com/package/dotenv). It has a global `.env` file and an additional `.env.[environment]` file for each environment (`'development'`, `'production'` and `'test'`).

The `.env` file stores the following configuration properties:

- `APP_NAME`: Used in emails sent to users when registering them.
- `S3_REGION`: The region where the bucket for uploading documents resides.
- `S3_SIGNATURE_VERSION`: The [AWS signature version](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html) for S3.
- `DOCUMENTS_BUCKET_NAME`: The name for the bucket where documents will be uploaded.
- `SESSION_TTL`: Users' session duration (in seconds). After their session expires, users will need to log in again.
- `UUID_NAMESPACE`: Namespace for auto-generating UUIDs to use as [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token)'s JTI.
- `PORT`: Port for the Express server to listen in.

The `.env.[environment]` files contain the following properties:

- `FRONTEND_URL`: Xploristo's frontend URL. Used to configure CORS middleware to allow requests from that origin. Also used in emails sent to users when registering them.

### Local configuration files

You will also need to **add a `.env.[environment].local` file to the project's root**. It must contain the following configuration properties:

- `MONGODB_URI`: A MongoDB [SRV connection string](https://www.mongodb.com/basics/mongodb-connection-string).
- `S3_ACCESS_KEY_ID`: The [access key id](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html) for a AWS IAM user with read and write access to the documents bucket.
- `S3_SECRET_ACCESS_KEY`: The secret access key for said IAM user.
- `REDIS_HOST`: Redis is used for storing users' session data. We will need its host, port, username and password.
- `REDIS_PORT`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `JWT_SECRET`: The secret to [sign and verify JWTs](https://www.npmjs.com/package/jsonwebtoken).
- `MAIL_USER`: This app uses [nodemailer](https://www.npmjs.com/package/nodemailer) to send emails using Gmail, so a Gmail user and password need to be provided.
- `MAIL_PASS`

> [!CAUTION]
These local configuration files should not be uploaded to GitHub (which is prevented using `.gitignore` file) because they contain sensitive information, like passwords.

## Usage

Run:

- `npm run start:dev` to run the application locally using [Serverless Offline](https://www.serverless.com/plugins/serverless-offline).
- `npm run start:server` to run the application locally as a server.

- `npm run nodemon` to run the application (as serverless) using [Nodemon](https://www.npmjs.com/package/nodemon), which will automatically restart it on file changes.
- `npm run nodemon:server` to run the application (as a server) using Nodemon.

- `npm run test` to run tests (with a coverage report in text format).
- `npm run test:only` to run tests without any coverage report.
- `npm run test:report` to run tests generating an additional HTML coverage report. This report will be stored in a new `coverage` folder. You can see it by opening `coverage/index.html` in your browser.

- `npm run lint` to find lint errors and warnings.
- `npm run lint:fix` to fix lint errors and warnings.

- `npm run deploy` to deploy the app to the 'development' stage via AWS CloudFormation [using Serverless framework](https://www.serverless.com/framework/docs/providers/aws/cli-reference/deploy). See Deploying the application as an AWS Lambda Function section.
- `npm run deploy:production` to deploy the app to the 'production' stage.

## Serverless or serverful?

As seen in Usage section, Xploristo can be both run as a serverless app (using [Serverless](https://www.serverless.com/) framework) or as a _normal_ server (by running `npm run start:server`).

### Deploying the application as an AWS Lambda Function

First, install Serverless by running `npm install -g serverless`. Official setup instructions can be found [here](https://www.serverless.com/framework/docs/getting-started).

Then, create an AWS IAM user with the `AdministratorAccess` policy. You can name it, for example, 'serverless-admin'. To use it programmatically via the AWS CLI, you will also need to create an access key for it. Save both the access key and the secret access key.

Finally, configure Serverless CLI by using the [`serverless config`](https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials) command:

``` bash
serverless config credentials --provider aws --key [ACCESS_KEY_ID] --secret [SECRET_ACCESS_KEY] --profile serverless-admin
```

Now that everything is ready, you can run the `npm run deploy` (or `npm run deploy:production`) command, which will run the [`serverless deploy`](https://www.serverless.com/framework/docs/providers/aws/cli-reference/deploy) command for you. It will output the URL for the deployed application.

Our Lambda function is configured using the `serverless.yml` file. You can find more information about this configuration file in the [Serverless documentation](https://www.serverless.com/framework/docs/providers/aws/guide/intro).
