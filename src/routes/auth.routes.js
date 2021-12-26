import express from 'express';

import AuthController from '../controllers/auth.controller.js';

export default express
  .Router()
  .post('/', AuthController.login);
