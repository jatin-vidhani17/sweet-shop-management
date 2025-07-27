require('dotenv').config({ path: '../../../.env' });
const supabasePromise = require('../../../supabase/client');
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
    const sweetId = req.query.id || req.params?.id;

    if (!sweetId) {
      return res.status(400).json({ message: 'Sweet ID is required' });
    }

    // POST /api/sweets/[id]/restock - Restock sweet (Admin only)
    if (req.method === 'POST') {
      try {
        const user = verifyToken(req);
        
        if (user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
          return res.status(400).json({ message: 'Valid quantity is required' });
        }

        // Get current sweet data
        const { data: sweet, error: fetchError } = await supabase
          .from('sweets')
          .select('*')
          .eq('id', sweetId)
          .single();

        if (fetchError || !sweet) {
          return res.status(404).json({ message: 'Sweet not found' });
        }

        // Update quantity (add to existing stock)
        const newQuantity = sweet.quantity + quantity;
        const { data: updatedSweet, error: updateError } = await supabase
          .from('sweets')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', sweetId)
          .select()
          .single();

        if (updateError) {
          console.error('Error restocking sweet:', updateError);
          return res.status(500).json({ message: 'Error restocking sweet' });
        }

        return res.status(200).json({
          message: 'Restock successful',
          sweet: updatedSweet,
          restock: {
            quantity_added: quantity,
            previous_stock: sweet.quantity,
            new_stock: newQuantity
          }
        });
      } catch (authError) {
        if (authError.message === 'Admin access required') {
          return res.status(403).json({ message: authError.message });
        }
        return res.status(401).json({ message: authError.message });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error in restock API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
