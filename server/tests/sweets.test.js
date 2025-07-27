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
const sweetsHandler = require('../api/sweets');
const sweetByIdHandler = require('../api/sweets/[id]');
const searchHandler = require('../api/sweets/search');
const purchaseHandler = require('../api/sweets/[id]/purchase');
const restockHandler = require('../api/sweets/[id]/restock');

app.use('/api/auth/register', registerHandler);
app.use('/api/auth/login', loginHandler);

// Order matters: more specific routes first
app.use('/api/sweets/search', searchHandler);
app.use('/api/sweets/:id/purchase', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  purchaseHandler(req, res);
});
app.use('/api/sweets/:id/restock', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  restockHandler(req, res);
});
app.use('/api/sweets/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  sweetByIdHandler(req, res);
});
app.use('/api/sweets', sweetsHandler);

jest.setTimeout(30000);

describe('Sweets API', () => {
  let supabase;
  let customerToken;
  let adminToken;
  let testSweet;

  const customerUser = {
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'customer'
  };

  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    role: 'admin'
  };

  const sweetData = {
    name: 'Test Chocolate',
    category: 'chocolate',
    price: 5.99,
    quantity: 100,
    description: 'Delicious test chocolate'
  };

  beforeAll(async () => {
    supabase = createSupabaseClient();
    
    // Clean up existing test data
    await supabase.from('sweets').delete().ilike('name', '%test%');
    await supabase.from('users').delete().in('email', [customerUser.email, adminUser.email]);

    // Register test users
    const customerRes = await request(app)
      .post('/api/auth/register')
      .send(customerUser)
      .expect(201);
    customerToken = customerRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/register')
      .send(adminUser)
      .expect(201);
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('sweets').delete().ilike('name', '%test%');
    await supabase.from('users').delete().in('email', [customerUser.email, adminUser.email]);
  });

  describe('POST /api/sweets', () => {
    afterEach(async () => {
      await supabase.from('sweets').delete().ilike('name', '%test%');
    });

    it('should create a sweet with admin token', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(sweetData.name);
      expect(response.body.data.price).toBe(sweetData.price);

      testSweet = response.body.data;
    });

    it('should fail to create a sweet without admin privileges', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(sweetData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should fail to create a sweet without authentication', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .send(sweetData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Sweet'
          // missing other required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing fields');
    });

    it('should fail with invalid price', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...sweetData,
          price: -5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid price');
    });

    it('should fail with invalid quantity', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...sweetData,
          quantity: -1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid quantity');
    });
  });

  describe('GET /api/sweets', () => {
    beforeEach(async () => {
      // Create a test sweet
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData)
        .expect(201);
      testSweet = response.body.data;
    });

    afterEach(async () => {
      await supabase.from('sweets').delete().ilike('name', '%test%');
    });

    it('should get all sweets with authentication', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/sweets')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('GET /api/sweets/search', () => {
    beforeEach(async () => {
      // Create test sweets
      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData);

      await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...sweetData,
          name: 'Test Candy',
          category: 'candy',
          price: 2.99
        });
    });

    afterEach(async () => {
      await supabase.from('sweets').delete().ilike('name', '%test%');
    });

    it('should search sweets by name', async () => {
      const response = await request(app)
        .get('/api/sweets/search?name=test')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name.toLowerCase()).toContain('test');
    });

    it('should search sweets by category', async () => {
      const response = await request(app)
        .get('/api/sweets/search?category=candy')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].category).toBe('candy');
    });

    it('should search sweets by price range', async () => {
      const response = await request(app)
        .get('/api/sweets/search?minPrice=1&maxPrice=3')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].price).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].price).toBeLessThanOrEqual(3);
    });
  });

  describe('PUT /api/sweets/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData);
      testSweet = response.body.data;
    });

    afterEach(async () => {
      await supabase.from('sweets').delete().ilike('name', '%test%');
    });

    it('should update a sweet with admin privileges', async () => {
      const updateData = {
        name: 'Updated Test Chocolate',
        price: 7.99
      };

      const response = await request(app)
        .put(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should fail without admin privileges', async () => {
      const response = await request(app)
        .put(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Authorization failed');
    });
  });

  describe('DELETE /api/sweets/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData);
      testSweet = response.body.data;
    });

    it('should delete a sweet with admin privileges', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should fail without admin privileges', async () => {
      const response = await request(app)
        .delete(`/api/sweets/${testSweet.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Authorization failed');
    });
  });

  describe('POST /api/sweets/:id/purchase', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData);
      testSweet = response.body.data;
    });

    afterEach(async () => {
      await supabase.from('sweets').delete().ilike('name', '%test%');
    });

    it('should purchase a sweet successfully', async () => {
      const purchaseData = { quantity: 5 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.purchase.quantity_purchased).toBe(5);
      expect(response.body.purchase.remaining_stock).toBe(95);
    });

    it('should fail with insufficient stock', async () => {
      const purchaseData = { quantity: 150 }; // More than available

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Insufficient stock');
    });

    it('should fail with invalid quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/purchase`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: -1 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid quantity');
    });
  });

  describe('POST /api/sweets/:id/restock', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData);
      testSweet = response.body.data;
    });

    afterEach(async () => {
      await supabase.from('sweets').delete().ilike('name', '%test%');
    });

    it('should restock a sweet with admin privileges', async () => {
      const restockData = { quantity: 50 };

      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(restockData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.restock.quantity_added).toBe(50);
      expect(response.body.restock.new_stock).toBe(150);
    });

    it('should fail without admin privileges', async () => {
      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 50 })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should fail with invalid quantity', async () => {
      const response = await request(app)
        .post(`/api/sweets/${testSweet.id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})  // Missing quantity field
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing fields');
    });
  });
});
