module.exports = async (req, res) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed' 
    });
  }

  try {
    return res.status(200).json({
      status: 'healthy',
      message: 'Sweet Shop Management API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        auth: {
          login: '/api/auth/login',
          register: '/api/auth/register'
        },
        sweets: '/api/sweets',
        user: '/api/user',
        analytics: '/api/analytics'
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Health check failed' 
    });
  }
};
