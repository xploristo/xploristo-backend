import { startServer, stopServer } from './src/app.js';

try {
  await startServer();
} catch (error) {
  console.error(error);
  process.exit(0);
}

// Docker stop
process.on('SIGTERM', async () => {
  await stopServer();
});

// Ctrl+C
process.on('SIGINT', async () => {
  await stopServer();
});

// Nodemon restart
process.on('SIGUSR2', async () => {
  await stopServer();
});
