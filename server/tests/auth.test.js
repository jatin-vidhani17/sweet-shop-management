require('dotenv').config({ path: '../.env' });
const request = require('supertest');
const express = require('express');
const { createSupabaseClient } = require('../supabase/client');

// Create test app
const app = express();
app.use(express.json());

// Import handlers
const registerHandler = require('../api/auth/register');
const loginHandler = require('../api/auth/login');

app.use('/api/auth/register', registerHandler);
app.use('/api/auth/login', loginHandler);

jest.setTimeout(30000);

describe('Authentication API', () => {
  let supabase;
  let testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'customer'
  };

  beforeAll(async () => {
    supabase = createSupabaseClient();
    
    // Clean up any existing test data
    await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);
  });

  afterEach(async () => {
    // Clean up after each test
    await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user.role).toBe(testUser.role);
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com'
          // missing password and confirmPassword
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing fields');
    });

    it('should fail with password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          confirmPassword: 'differentpassword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Password mismatch');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: '123',
          confirmPassword: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Weak password');
    });

    it('should fail with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          role: 'invalidrole'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid role');
    });

    it('should fail when user already exists', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing credentials');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing credentials');
    });

    it('should fail with incorrect email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });
});
