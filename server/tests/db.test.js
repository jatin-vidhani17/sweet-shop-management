// server/tests/db.test.js
require('dotenv').config({ path: '../.env' });
// Or use the correct relative path to your .env if it's elsewhere
 // Ensure env is loaded
const connectDB = require('../api/db');
const mongoose = require('mongoose');

describe('MongoDB Connection (Serverless Style)', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('should connect successfully to MongoDB', async () => {
    const connection = await connectDB();
    expect(connection.readyState).toBe(1); // 1 = connected
  });
});
// server/tests/db.test.js