import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import customErrorHandler from './middlewares/custom-error-handler.js';
import authMiddleware from './middlewares/auth.js';
import routes from './routes/routes.js';

const app = express();

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);

  app.use(express.json()); // For parsing application/json

  app.use(cors());

  app.use(authMiddleware);
  app.use(routes);
  app.use(customErrorHandler);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
