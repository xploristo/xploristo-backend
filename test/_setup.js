import { startServer, stopServer } from '../src/app.js';

before(async () => {
  try {
    await startServer();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
});

after(async () => {
  try {
    await stopServer();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
});
