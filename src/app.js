import serverless from 'serverless-http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import customErrorHandler from './middlewares/custom-error-handler.js';
import authHandler from './middlewares/auth-handler.js';
import routes from './routes/routes.js';
import s3Service from './services/s3.service.js';
import redisService from './services/redis.service.js';

const app = express();

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);

  app.use(express.json()); // For parsing application/json

  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }));

  app.use(cookieParser());

  app.use(authHandler);
  app.use(routes);
  app.use(customErrorHandler);

  bootstrapServices();
}

function bootstrapServices() {
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

const handler = serverless(app);
const asyncHandler = async (event) => {
  await start();
  return handler(event);
};

export {
  asyncHandler
};
