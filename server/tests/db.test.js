// tests/db.test.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const connectDB = require('../api/db');

jest.setTimeout(30000); // Increase timeout to 30 seconds for Atlas connections

describe('MongoDB Connection (Serverless Style)', () => {
  beforeAll(async () => {
    // Ensure MONGO_URI is set
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI must be defined in .env for tests');
    }
    await connectDB(); // Establish connection before tests
  });

  afterAll(async () => {
    await mongoose.disconnect(); // Properly disconnect after tests
  });

  test('should connect successfully to MongoDB', async () => {
    const connection = await connectDB();
    expect(connection.readyState).toBe(1); // Connected state
  }, 20000);

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
    expect(mongoose.connection.readyState).toBe(0); // Disconnected state
    const conn = await connectDB();
    expect(conn.readyState).toBe(1); // Connected state
  });
});