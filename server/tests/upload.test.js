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
      }))
    }))
  })),
  createSupabaseServiceClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://mock-url.com/image.jpg' }
        }))
      }))
    }
  }))
}));

describe('Upload API', () => {
  let adminToken;
  let userToken;

  beforeAll(() => {
    // Create test JWT tokens
    adminToken = jwt.sign(
      { id: 'admin1', email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      { id: 'user1', email: 'user@test.com', role: 'customer' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/upload', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({
          file: 'base64-image-data',
          fileName: 'test.jpg'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    test('should reject non-admin users', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          file: 'base64-image-data',
          fileName: 'test.jpg'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Authorization failed');
    });

    test('should reject requests without file data', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fileName: 'test.jpg'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing file data');
    });

    test('should reject requests without fileName', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          file: 'base64-image-data'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing file data');
    });

    test('should handle successful image upload', async () => {
      const { createSupabaseServiceClient } = require('../supabase/client');
      const mockSupabase = createSupabaseServiceClient();
      
      // Mock successful upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'sweet-123456-test.jpg' },
        error: null
      });

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD',
          fileName: 'test.jpg'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('path');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('fileName');
      expect(response.body.message).toBe('Image uploaded successfully');
    });

    test('should handle Supabase storage errors', async () => {
      const { createSupabaseServiceClient } = require('../supabase/client');
      const mockSupabase = createSupabaseServiceClient();
      
      // Mock storage error
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' }
      });

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          file: 'base64-image-data',
          fileName: 'test.jpg'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Upload failed');
    });

    test('should handle different image formats', async () => {
      const { createSupabaseServiceClient } = require('../supabase/client');
      const mockSupabase = createSupabaseServiceClient();
      
      // Mock successful upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'sweet-123456-test.png' },
        error: null
      });

      const formats = ['test.png', 'test.gif', 'test.webp'];
      
      for (const fileName of formats) {
        const response = await request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            file: 'base64-image-data',
            fileName
          });

        expect(response.status).toBe(200);
      }
    });

    test('should generate unique file names', async () => {
      const { createSupabaseServiceClient } = require('../supabase/client');
      const mockSupabase = createSupabaseServiceClient();
      
      let capturedFileName;
      mockSupabase.storage.from().upload.mockImplementation((fileName) => {
        capturedFileName = fileName;
        return Promise.resolve({
          data: { path: fileName },
          error: null
        });
      });

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          file: 'base64-image-data',
          fileName: 'test.jpg'
        });

      expect(response.status).toBe(200);
      expect(capturedFileName).toMatch(/^sweet-\d+-test\.jpg$/);
    });
  });

  describe('CORS handling', () => {
    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/upload');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    test('should include CORS headers in responses', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({
          file: 'base64-image-data',
          fileName: 'test.jpg'
        });

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
});
