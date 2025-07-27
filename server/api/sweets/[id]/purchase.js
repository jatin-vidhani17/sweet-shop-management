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

    // POST /api/sweets/[id]/purchase - Purchase sweet
    if (req.method === 'POST') {
      try {
        const user = verifyToken(req);
        
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
          return res.status(400).json({ message: 'Valid quantity is required' });
        }

        // Get current sweet data
        const { data: sweet, error: fetchError } = await supabase
          .from('sweets')
          .select('*')
          .eq('id', sweetId)
          .eq('is_active', true)
          .single();

        if (fetchError || !sweet) {
          return res.status(404).json({ message: 'Sweet not found or inactive' });
        }

        if (sweet.quantity < quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock. Available: ${sweet.quantity}, Requested: ${quantity}` 
          });
        }

        // Update quantity
        const newQuantity = sweet.quantity - quantity;
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
          console.error('Error updating sweet quantity:', updateError);
          return res.status(500).json({ message: 'Error processing purchase' });
        }

        // Create purchase record (optional - you can add a purchases table later)
        const purchaseData = {
          sweet_id: sweetId,
          user_id: user.id,
          quantity: quantity,
          unit_price: sweet.price,
          total_price: sweet.price * quantity,
          purchase_date: new Date().toISOString()
        };

        return res.status(200).json({
          message: 'Purchase successful',
          sweet: updatedSweet,
          purchase: {
            quantity: quantity,
            total_price: sweet.price * quantity,
            remaining_stock: newQuantity
          }
        });
      } catch (authError) {
        return res.status(401).json({ message: authError.message });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error in purchase API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
