import express from 'express';

import authMiddleware from './middlewares/auth.js';
import routes from './routes/routes.js';

const app = express();
const port = 8081;

app.use(authMiddleware);
app.use(routes);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
