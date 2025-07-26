require('dotenv').config({ path: '../.env' });
const connectDB = require('../api/db');
const mongoose = require('mongoose');

describe('MongoDB Connection (Serverless Style)', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('should connect successfully to MongoDB', async () => {
    const connection = await connectDB();
    expect(connection.readyState).toBe(1);
  });

  test('throws error if MONGO_URI is not set', async () => {
    const originalUri = process.env.MONGO_URI;
    delete process.env.MONGO_URI;
    jest.resetModules();
    const connectDB = require('../api/db');
    await expect(connectDB()).rejects.toThrow(/MONGO_URI is not defined/);
    process.env.MONGO_URI = originalUri;
  });

  test('multiple calls reuse the same connection', async () => {
    const conn1 = await connectDB();
    const conn2 = await connectDB();
    expect(conn1).toBe(conn2);
  });

  test('can reconnect after disconnect', async () => {
    await connectDB();
    await mongoose.disconnect();
    expect(mongoose.connection.readyState).toBe(0);
    const conn = await connectDB();
    expect(conn.readyState).toBe(1);
  });
});
