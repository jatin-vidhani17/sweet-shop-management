require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const connectDB = require('../api/db');
const registerHandler = require('../api/auth/register');
const User = require('../models/User');

jest.setTimeout(30000); // Increase timeout for Atlas

// Utility to mock req/res for serverless functions
function createMocks({ method = 'POST', body = {} } = {}) {
  let statusValue = 0;
  let resultPayload = undefined;
  const res = {
    status(status) {
      statusValue = status;
      return this;
    },
    json(payload) {
      resultPayload = payload;
      return this;
    },
    get statusCode() {
      return statusValue;
    },
    get payload() {
      return resultPayload;
    },
  };
  return {
    req: { method, body },
    res,
  };
}

describe('Register API Handler', () => {
  beforeAll(async () => {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error('MONGO_URI and JWT_SECRET must be defined in .env');
    }
    await connectDB(); // Connect to Atlas
  });

  afterEach(async () => {
    await User.deleteMany({}); // Clear User collection between tests
  });

  afterAll(async () => {
    await mongoose.disconnect(); // Disconnect from Atlas
  });

  it('returns 405 if method is not POST', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.payload.message).toBe('Method Not Allowed');
  });

  it('returns 400 if required fields missing', async () => {
    const { req, res } = createMocks({ body: { name: 'Test' } });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/Please enter all fields/);
  });

  it("returns 400 if passwords don't match", async () => {
    const { req, res } = createMocks({
      body: {
        name: 'Test',
        email: 'test@example.com',
        role: 'customer',
        password: 'a',
        confirmPassword: 'b',
      },
    });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/Passwords don't match/);
  });

  it('creates a new user and returns a token on valid input', async () => {
    const { req, res } = createMocks({
      body: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        password: 'password123',
        confirmPassword: 'password123',
      },
    });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.payload.token).toBeDefined();

    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('customer');
    expect(user.password).not.toBe('password123'); // Password should be hashed
  });

  it('returns 400 if user already exists', async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      password: 'hashedpassword',
    });

    const { req, res } = createMocks({
      body: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        password: 'password123',
        confirmPassword: 'password123',
      },
    });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/User with that email already exists/);
  });

  it('creates multiple unique users with different emails', async () => {
    const users = [
      {
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'customer',
        password: 'alice123',
        confirmPassword: 'alice123',
      },
      {
        name: 'Bob Jones',
        email: 'bob@example.com',
        role: 'admin',
        password: 'bob123',
        confirmPassword: 'bob123',
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        role: 'customer',
        password: 'charlie123',
        confirmPassword: 'charlie123',
      },
    ];

    const results = await Promise.all(
      users.map(async (userData) => {
        const { req, res } = createMocks({ body: userData });
        await registerHandler(req, res);
        return { statusCode: res.statusCode, payload: res.payload };
      })
    );

    // Check API responses
    results.forEach((result, index) => {
      expect(result.statusCode).toBe(201);
      expect(result.payload.token).toBeDefined();
    });

    // Verify users in the database
    const savedUsers = await User.find({
      email: { $in: users.map((u) => u.email) },
    });
    expect(savedUsers.length).toBe(3);
    savedUsers.forEach((user, index) => {
      expect(user.name).toBe(users[index].name);
      expect(user.email).toBe(users[index].email);
      expect(user.role).toBe(users[index].role);
      expect(user.password).not.toBe(users[index].password); // Password should be hashed
    });
  });

  it('rejects duplicate emails across multiple users', async () => {
    // Create first user
    await User.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'customer',
      password: 'hashedpassword',
    });

    const users = [
      {
        name: 'Bob Jones',
        email: 'alice@example.com', // Duplicate email
        role: 'admin',
        password: 'bob123',
        confirmPassword: 'bob123',
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        role: 'customer',
        password: 'charlie123',
        confirmPassword: 'charlie123',
      },
    ];

    const results = await Promise.all(
      users.map(async (userData) => {
        const { req, res } = createMocks({ body: userData });
        await registerHandler(req, res);
        return { statusCode: res.statusCode, payload: res.payload };
      })
    );

    // Check API responses
    expect(results[0].statusCode).toBe(400);
    expect(results[0].payload.message).toMatch(/User with that email already exists/);
    expect(results[1].statusCode).toBe(201);
    expect(results[1].payload.token).toBeDefined();

    // Verify users in the database
    const savedUsers = await User.find({
      email: { $in: users.map((u) => u.email) },
    });
    expect(savedUsers.length).toBe(2); // Only Alice and Charlie should exist
    expect(savedUsers.some((u) => u.email === 'alice@example.com')).toBe(true);
    expect(savedUsers.some((u) => u.email === 'charlie@example.com')).toBe(true);
  });
});