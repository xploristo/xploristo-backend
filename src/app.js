import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import customErrorHandler from './middlewares/custom-error-handler.js';
import authHandler from './middlewares/auth-handler.js';
import testAuthHandler from './middlewares/test-auth-handler.js';
import routes from './routes/routes.js';
import s3Service from './services/s3.service.js';
import redisService from './services/redis.service.js';
import mongooseService from './services/mongoose.service.js';
import mailService from './services/mail.service.js';
import authService from './services/auth.service.js';

const defaultPort = 8081;

let server;

const app = express();

async function start() {
  await bootstrapServices();

  app.use(express.json()); // For parsing application/json

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(cookieParser());

  app.use(process.env.NODE_ENV === 'test' ? testAuthHandler : authHandler);
  app.use(routes);
  app.use(customErrorHandler);
}

async function bootstrapServices() {
  await mongooseService.connect(process.env.MONGODB_URI);

  await redisService.bootstrap({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });

  s3Service.bootstrap({
    signatureVersion: process.env.S3_SIGNATURE_VERSION,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });

  mailService.bootstrap({
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  });

  authService.bootstrap();
}

async function stop() {
  redisService.disconnect();
  console.info('👋 Redis disconnected.');

  await mongooseService.disconnect();
  console.info('👋 MongoDB disconnected.');

  console.info('👋 Exiting...');
  process.exit(0);
}

// TODO Errors when starting app via handler are sent as 200
// errorMessage, errorType, stackTrace

// TODO Log requests ?

/**
 * Starts the application as an Express server.
 */
async function startServer() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: `.env.${process.env.NODE_ENV}.local` });
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
  dotenv.config({ path: '.env' });

  await start();
  await new Promise((resolve) => {
    let appPort = process.env.PORT || defaultPort;

    server = app.listen(appPort, () => {
      console.info(`✅ Express server listening at port: ${appPort}.`);
      resolve(true);
    });
  });
}

/**
 * Stops the application launched as an Express server.
 */
async function stopServer() {
  await new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.info('👋 Express server stopped.');
        resolve(true);
      });
    } else {
      resolve(true);
    }
  });
  await stop();
}

/**
 * Launches the application using Serverless framework.
 */
const handler = serverless(app, { callbackWaitsForEmptyEventLoop: false });
const asyncHandler = async (event) => {
  await start();
  return handler(event);
};

export default { app };
export { startServer, stopServer, asyncHandler };

// TODO This does not seem to work
// AWS Lambda graceful shutdown https://github.com/aws-samples/graceful-shutdown-with-aws-lambda
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, cleaning up 🧹');
  await stop();
});
