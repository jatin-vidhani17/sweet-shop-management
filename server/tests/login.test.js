require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const connectDB = require('../api/db');
const loginHandler = require('../api/auth/login');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

describe('Login API Handler', () => {
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
    await loginHandler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.payload.message).toBe('Method Not Allowed');
  });

  it('returns 400 if email or password is missing', async () => {
    const { req, res } = createMocks({ body: { email: 'test@example.com' } });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/Please enter both email and password/);
  });

  it('returns 400 if user does not exist', async () => {
    const { req, res } = createMocks({
      body: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/Invalid email or password/);
  });

  it('returns 400 if password is incorrect', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      password: hashedPassword,
    });

    const { req, res } = createMocks({
      body: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/Invalid email or password/);
  });

  it('returns 200 and token for valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      password: hashedPassword,
    });

    const { req, res } = createMocks({
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.token).toBeDefined();
  });

  it('allows multiple users to login with valid credentials', async () => {
    const users = [
      {
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'customer',
        password: 'alice123',
      },
      {
        name: 'Bob Jones',
        email: 'bob@example.com',
        role: 'admin',
        password: 'bob123',
      },
    ];

    // Create users with hashed passwords
    await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await User.create({
          name: user.name,
          email: user.email,
          role: user.role,
          password: hashedPassword,
        });
      })
    );

    // Test login for each user
    const results = await Promise.all(
      users.map(async (user) => {
        const { req, res } = createMocks({
          body: {
            email: user.email,
            password: user.password,
          },
        });
        await loginHandler(req, res);
        return { statusCode: res.statusCode, payload: res.payload };
      })
    );

    results.forEach((result) => {
      expect(result.statusCode).toBe(200);
      expect(result.payload.token).toBeDefined();
    });
  });
});