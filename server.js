import { startServer, stopServer } from './src/app.js';

try {
  await startServer();
} catch (error) {
  console.error(error);
  process.exit(0);
}

async function stop() {
  await stopServer();

  console.info('👋 Exiting...');
  process.exit(0);
}

// Docker stop
process.on('SIGTERM', async () => {
  await stop();
});

// Ctrl+C
process.on('SIGINT', async () => {
  await stop();
});

// Nodemon restart
process.on('SIGUSR2', async () => {
  await stop();
});
