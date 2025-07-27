const { createSupabaseClient } = require('../supabase/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

module.exports = async (req, res) => {
  // Handle CORS for Vercel deployment
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const supabase = createSupabaseClient();

  try {
    switch (req.method) {
      case 'GET':
        // GET requests are public - no authentication required for browsing sweets
        return await getSweets(req, res, supabase);
      case 'POST':
        // POST requests require authentication
        await new Promise((resolve, reject) => {
          authMiddleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return await createSweet(req, res, supabase);
      default:
        return res.status(405).json({ 
          error: 'Method Not Allowed',
          message: `${req.method} method is not supported` 
        });
    }
  } catch (authError) {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: authError.message || 'Please provide valid authentication'
    });
  }
};

// GET /api/sweets - Get all sweets
async function getSweets(req, res, supabase) {
  try {
    const { data: sweets, error } = await supabase
      .from('sweets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sweets:', error);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch sweets' 
      });
    }

    return res.status(200).json({
      success: true,
      data: sweets,
      count: sweets.length
    });
  } catch (err) {
    console.error('Error in getSweets:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'An internal server error occurred' 
    });
  }
}

// POST /api/sweets - Create a new sweet
async function createSweet(req, res, supabase) {
  try {
    // Apply admin middleware
    await new Promise((resolve, reject) => {
      adminMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

      const { name, category, price, quantity, description, image_url, ingredients, is_active } = req.body;    // Validation
    if (!name || !category || !price || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Missing fields',
        message: 'Please provide name, category, price, and quantity' 
      });
    }

    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ 
        error: 'Invalid price',
        message: 'Price must be a positive number' 
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'Quantity must be a non-negative number' 
      });
    }

    // Check if sweet with same name already exists
    const { data: existingSweet, error: checkError } = await supabase
      .from('sweets')
      .select('name')
      .eq('name', name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking sweet:', checkError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Error checking sweet existence' 
      });
    }

    if (existingSweet) {
      return res.status(400).json({ 
        error: 'Sweet exists',
        message: 'A sweet with that name already exists' 
      });
    }

    // Create new sweet
    const { data: newSweet, error: insertError } = await supabase
      .from('sweets')
      .insert([{ 
        name: name.trim(), 
        category: category.trim(), 
        price: parseFloat(price), 
        quantity: parseInt(quantity),
        description: description?.trim() || '',
        image_url: image_url || null,
        ingredients: ingredients || [],
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating sweet:', insertError);
      return res.status(500).json({ 
        error: 'Creation failed',
        message: 'Failed to create sweet' 
      });
    }

    return res.status(201).json({
      success: true,
      data: newSweet,
      message: 'Sweet created successfully'
    });
  } catch (authError) {
    return res.status(403).json({ 
      error: 'Authorization failed',
      message: 'Admin privileges required to create sweets'
    });
  }
}
