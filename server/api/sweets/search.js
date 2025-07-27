const { createSupabaseClient } = require('../../supabase/client');
const { authMiddleware } = require('../../middleware/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed' 
    });
  }

  const supabase = createSupabaseClient();

  try {
    // Apply authentication middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { name, category, minPrice, maxPrice, limit = 50 } = req.query;

    // Build query
    let query = supabase
      .from('sweets')
      .select('*');

    // Apply filters
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (minPrice !== undefined) {
      const min = parseFloat(minPrice);
      if (!isNaN(min) && min >= 0) {
        query = query.gte('price', min);
      }
    }

    if (maxPrice !== undefined) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max) && max >= 0) {
        query = query.lte('price', max);
      }
    }

    // Add ordering and limit
    query = query
      .order('name', { ascending: true })
      .limit(parseInt(limit) || 50);

    const { data: sweets, error } = await query;

    if (error) {
      console.error('Error searching sweets:', error);
      return res.status(500).json({ 
        error: 'Search failed',
        message: 'Error searching sweets' 
      });
    }

    return res.status(200).json({
      success: true,
      data: sweets,
      count: sweets.length,
      filters: {
        name: name || null,
        category: category || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null
      }
    });
  } catch (authError) {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: authError.message || 'Please provide valid authentication'
    });
  }
};