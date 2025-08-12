const request = require('supertest');
const app = require('../test-server');
const jwt = require('jsonwebtoken');

// Mock Supabase client
jest.mock('../supabase/client', () => ({
  createSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }))
}));

describe('Purchase API', () => {
  let userToken;
  let adminToken;

  beforeAll(() => {
    // Create test JWT tokens
    userToken = jwt.sign(
      { id: 'user1', email: 'user@test.com', role: 'customer' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: 'admin1', email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sweets/:id/purchase', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/sweets/1/purchase')
        .send({
          quantity: 1
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    test('should reject requests without sweet ID', async () => {
      const response = await request(app)
        .post('/api/sweets//purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(404);
    });

    test('should reject invalid quantity values', async () => {
      const invalidQuantities = [0, -1, 'invalid', null, undefined];

      for (const quantity of invalidQuantities) {
        const response = await request(app)
          .post('/api/sweets/1/purchase')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ quantity });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid quantity');
      }
    });

    test('should handle non-existent sweet', async () => {
      const { createSupabaseClient } = require('../supabase/client');
      const mockSupabase = createSupabaseClient();
      
      // Mock sweet not found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const response = await request(app)
        .post('/api/sweets/999/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Sweet not found');
    });

    test('should handle insufficient stock', async () => {
      const { createSupabaseClient } = require('../supabase/client');
      const mockSupabase = createSupabaseClient();
      
      // Mock sweet with low stock
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 1,
          name: 'Chocolate Cake',
          price: 25.99,
          quantity: 2,
          category: 'cakes'
        },
        error: null
      });

      const response = await request(app)
        .post('/api/sweets/1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 5 // More than available
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Insufficient stock');
      expect(response.body.message).toBe('Only 2 items available');
    });

    test('should successfully process purchase', async () => {
      const { createSupabaseClient } = require('../supabase/client');
      const mockSupabase = createSupabaseClient();
      
      const mockSweet = {
        id: 1,
        name: 'Chocolate Cake',
        price: 25.99,
        quantity: 10,
        category: 'cakes'
      };

      // Mock sweet fetch
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSweet,
        error: null
      });

      // Mock successful update
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { ...mockSweet, quantity: 8 },
        error: null
      });

      const response = await request(app)
        .post('/api/sweets/1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.purchasedQuantity).toBe(2);
      expect(response.body.data.totalPrice).toBe(51.98); // 25.99 * 2
      expect(response.body.data.remainingStock).toBe(8);
      expect(response.body.message).toBe('Purchase completed successfully');
    });

    test('should handle database update errors', async () => {
      const { createSupabaseClient } = require('../supabase/client');
      const mockSupabase = createSupabaseClient();
      
      // Mock sweet fetch success
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 1,
          name: 'Chocolate Cake',
          price: 25.99,
          quantity: 10,
          category: 'cakes'
        },
        error: null
      });

      // Mock update failure
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const response = await request(app)
        .post('/api/sweets/1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Update failed');
    });

    test('should work with both user and admin tokens', async () => {
      const { createSupabaseClient } = require('../supabase/client');
      const mockSupabase = createSupabaseClient();
      
      const mockSweet = {
        id: 1,
        name: 'Chocolate Cake',
        price: 25.99,
        quantity: 10,
        category: 'cakes'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSweet,
        error: null
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { ...mockSweet, quantity: 9 },
        error: null
      });

      // Test with user token
      const userResponse = await request(app)
        .post('/api/sweets/1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 1 });

      expect(userResponse.status).toBe(200);

      // Test with admin token
      const adminResponse = await request(app)
        .post('/api/sweets/1/purchase')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 1 });

      expect(adminResponse.status).toBe(200);
    });
  });

  describe('CORS handling', () => {
    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/sweets/1/purchase');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    test('should include CORS headers in responses', async () => {
      const response = await request(app)
        .post('/api/sweets/1/purchase')
        .send({ quantity: 1 });

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
});
