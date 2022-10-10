import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import customErrorHandler from './middlewares/custom-error-handler.js';
import authHandler from './middlewares/auth-handler.js';
import routes from './routes/routes.js';
import s3Service from './services/s3.service.js';
import redisService from './services/redis.service.js';
import mongooseService from './services/mongoose.service.js';
import mailService from './services/mail.service.js';

const app = express();

async function start() {
  await mongooseService.connect(process.env.MONGODB_URI);

  app.use(express.json()); // For parsing application/json

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(cookieParser());

  app.use(authHandler);
  app.use(routes);
  app.use(customErrorHandler);

  bootstrapServices();
}

function bootstrapServices() {
  mailService.bootstrap({
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  });

  s3Service.bootstrap({
    signatureVersion: process.env.S3_SIGNATURE_VERSION,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });

  redisService.bootstrap({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });
}

async function stop() {
  redisService.disconnect();
  console.info('👋 Redis disconnected.');
  // await mongoose.disconnect();

  await mongooseService.disconnect();
  console.info('👋 MongoDB disconnected.');

  console.info('👋 Exiting...');
  process.exit(0);
}

// TODO Errors when starting app via handler are sent as 200
// errorMessage, errorType, stackTrace

// TODO Log requests ?

const handler = serverless(app, { callbackWaitsForEmptyEventLoop: false });
const asyncHandler = async (event) => {
  await start();
  return handler(event);
};

export { asyncHandler };

// TODO This does not seem to work
// AWS Lambda graceful shutdown https://github.com/aws-samples/graceful-shutdown-with-aws-lambda
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, cleaning up 🧹');
  await stop();
});
