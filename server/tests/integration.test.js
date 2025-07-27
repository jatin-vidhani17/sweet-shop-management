require('dotenv').config();
const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import API handlers
const sweetsHandler = require('../api/sweets');
const loginHandler = require('../api/auth/login');
const registerHandler = require('../api/auth/register');
const userHandler = require('../api/user');

app.use('/api/sweets', sweetsHandler);
app.use('/api/auth/login', loginHandler);
app.use('/api/auth/register', registerHandler);
app.use('/api/user', userHandler);

jest.setTimeout(30000);

describe('API Integration Tests', () => {
  let authToken;
  let adminToken;

  const testCustomer = {
    name: 'Test Customer',
    email: 'customer@test.com',
    password: 'password123',
    role: 'customer'
  };

  const testAdmin = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  };

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - should register customer', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testCustomer);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testCustomer.email);
      expect(response.body.user.role).toBe('customer');
    });

    test('POST /api/auth/register - should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testCustomer);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/auth/login - should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomer.email,
          password: testCustomer.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testCustomer.email);
      
      authToken = response.body.token;
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testCustomer.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Sweets Endpoints', () => {
    test('GET /api/sweets - should get sweets list', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/sweets - should reject without auth', async () => {
      const response = await request(app)
        .get('/api/sweets');

      expect(response.status).toBe(401);
    });

    test('POST /api/sweets - should require admin role', async () => {
      const newSweet = {
        name: 'Test Sweet',
        price: 9.99,
        description: 'A test sweet',
        category: 'test',
        stock: 100
      };

      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSweet);

      // Should fail because customer is not admin
      expect(response.status).toBe(403);
    });
  });

  describe('User Profile Endpoints', () => {
    test('GET /api/user - should get user profile', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testCustomer.email);
    });

    test('GET /api/user - should reject without auth', async () => {
      const response = await request(app)
        .get('/api/user');

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    test('Should handle missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS Headers', () => {
    test('Should handle OPTIONS request', async () => {
      const response = await request(app)
        .options('/api/sweets');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });
});
