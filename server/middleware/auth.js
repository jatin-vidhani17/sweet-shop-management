const jwt = require('jsonwebtoken');
const { createSupabaseClient } = require('../supabase/client');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token verification failed' 
    });
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'This operation requires admin privileges' 
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Authorization failed' 
    });
  }
};

module.exports = { authMiddleware, adminMiddleware };
