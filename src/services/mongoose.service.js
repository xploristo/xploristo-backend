import mongoose from 'mongoose';

let connected = false;

async function connect(mongodbURI) {
  if (!connected) {
    await mongoose.connect(mongodbURI);
    connected = true;
    console.info('✅ MongoDB is connected!');
  }
}

async function disconnect() {
  await mongoose.disconnect();
  connected = false;
}

export default {
  connect,
  disconnect,
};
