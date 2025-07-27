require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const connectDB = require('../api/db');
const User = require('../models/User');

// Set the base URL for the API (change to Vercel URL for deployed testing)
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

jest.setTimeout(30000); // Increase timeout for Atlas

describe('Register API Handler (Real HTTP Requests)', () => {
  beforeAll(async () => {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error('MONGO_URI and JWT_SECRET must be defined in .env');
    }
    await connectDB();
    console.log('Connected to database:', mongoose.connection.db.databaseName);
  });

  afterEach(async () => {
    // Only clear collection if KEEP_DATA is not set
    if (process.env.KEEP_DATA !== 'true') {
      await User.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('returns 405 if method is not POST', async () => {
    try {
      const response = await request(BASE_URL)
        .get('/api/auth/register')
        .set('Accept', 'application/json');

      console.log('Response (GET method):', response.status, response.body);
      expect(response.status).toBe(405);
      expect(response.body.message).toBe('Method Not Allowed');
    } catch (err) {
      console.error('GET request error:', err);
      throw err;
    }
  });

  it('returns 400 if required fields are missing', async () => {
    try {
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ name: 'Test' })
        .set('Accept', 'application/json');

      console.log('Response (missing fields):', response.status, response.body);
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Please enter all fields/);
    } catch (err) {
      console.error('Missing fields request error:', err);
      throw err;
    }
  });

  it("returns 400 if passwords don't match", async () => {
    try {
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'test@example.com',
          role: 'customer',
          password: 'a',
          confirmPassword: 'b',
        })
        .set('Accept', 'application/json');

      console.log('Response (password mismatch):', response.status, response.body);
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Passwords don't match/);
    } catch (err) {
      console.error('Password mismatch request error:', err);
      throw err;
    }
  });

  it('creates a new user and returns a token on valid input', async () => {
    try {
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          role: 'customer',
          password: 'password123',
          confirmPassword: 'password123',
        })
        .set('Accept', 'application/json');

      console.log('Collection:', User.collection.collectionName);
      console.log('Response (valid input):', response.status, response.body);

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('customer');
      expect(user.password).not.toBe('password123');
    } catch (err) {
      console.error('Valid input request error:', err);
      throw err;
    }
  });

  it('returns 400 if user already exists', async () => {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        password: hashedPassword,
      });

      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          role: 'customer',
          password: 'password123',
          confirmPassword: 'password123',
        })
        .set('Accept', 'application/json');

      console.log('Response (duplicate user):', response.status, response.body);
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/User with that email already exists/);
    } catch (err) {
      console.error('Duplicate user request error:', err);
      throw err;
    }
  });

  it('creates multiple unique users with different emails', async () => {
    try {
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

      const responses = await Promise.all(
        users.map(async (userData) => {
          const response = await request(BASE_URL)
            .post('/api/auth/register')
            .send(userData)
            .set('Accept', 'application/json');
          return response;
        })
      );

      responses.forEach((response, index) => {
        console.log(`Response for ${users[index].email}:`, response.status, response.body);
        expect(response.status).toBe(201);
        expect(response.body.token).toBeDefined();
      });

      const savedUsers = await User.find({
        email: { $in: users.map((u) => u.email) },
      });
      expect(savedUsers.length).toBe(3);
      savedUsers.forEach((user, index) => {
        expect(user.name).toBe(users[index].name);
        expect(user.email).toBe(users[index].email);
        expect(user.role).toBe(users[index].role);
        expect(user.password).not.toBe(users[index].password);
      });
    } catch (err) {
      console.error('Multiple users request error:', err);
      throw err;
    }
  });

  it('rejects duplicate emails across multiple users', async () => {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'customer',
        password: hashedPassword,
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

      const responses = await Promise.all(
        users.map(async (userData) => {
          const response = await request(BASE_URL)
            .post('/api/auth/register')
            .send(userData)
            .set('Accept', 'application/json');
          return response;
        })
      );

      console.log('Response (duplicate email):', responses[0].status, responses[0].body);
      console.log('Response (unique email):', responses[1].status, responses[1].body);
      expect(responses[0].status).toBe(400);
      expect(responses[0].body.message).toMatch(/User with that email already exists/);
      expect(responses[1].status).toBe(201);
      expect(responses[1].body.token).toBeDefined();

      const savedUsers = await User.find({
        email: { $in: users.map((u) => u.email) },
      });
      expect(savedUsers.length).toBe(2);
      expect(savedUsers.some((u) => u.email === 'alice@example.com')).toBe(true);
      expect(savedUsers.some((u) => u.email === 'charlie@example.com')).toBe(true);
    } catch (err) {
      console.error('Duplicate emails request error:', err);
      throw err;
    }
  });

  it('creates a user and preserves data for Atlas inspection', async () => {
    try {
      process.env.KEEP_DATA = 'true'; // Prevent cleanup
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({
          name: 'Inspect User',
          email: 'inspect@example.com',
          role: 'customer',
          password: 'inspect123',
          confirmPassword: 'inspect123',
        })
        .set('Accept', 'application/json');

      console.log('Collection:', User.collection.collectionName);
      console.log('Response (inspection):', response.status, response.body);
      console.log('Users in database after test:', await User.find({}).lean());

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();

      const user = await User.findOne({ email: 'inspect@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('Inspect User');
      expect(user.role).toBe('customer');
      expect(user.password).not.toBe('inspect123');
    } catch (err) {
      console.error('Inspection request error:', err);
      throw err;
    }
  });
});