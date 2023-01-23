import { startServer } from '../src/app.js';

try {
  await startServer();
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error);
}
