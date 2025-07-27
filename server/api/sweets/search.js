require('dotenv').config({ path: '../../.env' });
const supabasePromise = require('../../supabase/client');
const jwt = require('jsonwebtoken');

// Helper function to verify JWT token
const verifyToken = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = async (req, res) => {
  try {
    const supabase = await supabasePromise;

    // GET /api/sweets/search - Search sweets
    if (req.method === 'GET') {
      try {
        const user = verifyToken(req);
        
        const { name, category, minPrice, maxPrice } = req.query;
        
        let query = supabase
          .from('sweets')
          .select('*')
          .eq('is_active', true);

        // Apply filters
        if (name) {
          query = query.ilike('name', `%${name}%`);
        }
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (minPrice !== undefined) {
          query = query.gte('price', parseFloat(minPrice));
        }
        
        if (maxPrice !== undefined) {
          query = query.lte('price', parseFloat(maxPrice));
        }

        const { data: sweets, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error searching sweets:', error);
          return res.status(500).json({ message: 'Error searching sweets' });
        }

        return res.status(200).json(sweets);
      } catch (authError) {
        return res.status(401).json({ message: authError.message });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error in sweets search API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
