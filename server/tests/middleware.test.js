require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should pass with valid token', async () => {
      const payload = { 
        user: { 
          id: 'test-id', 
          email: 'test@example.com',
          role: 'customer' 
        } 
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      
      req.headers.authorization = `Bearer ${token}`;
      
      authMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(payload.user);
    });

    it('should fail without token', () => {
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access token required',
        message: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail with malformed authorization header', () => {
      req.headers.authorization = 'InvalidFormat';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    it('should pass for admin user', () => {
      req.user = { id: 'admin-id', role: 'admin' };
      
      adminMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should fail for customer user', () => {
      req.user = { id: 'customer-id', role: 'customer' };
      
      adminMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        message: 'This operation requires admin privileges'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail without user', () => {
      req.user = null;
      
      adminMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required',
        message: 'This operation requires admin privileges'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
