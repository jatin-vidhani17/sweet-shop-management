const { createSupabaseClient } = require('../../../supabase/client');
const { authMiddleware } = require('../../../middleware/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  const supabase = createSupabaseClient();
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      error: 'Missing parameter',
      message: 'Sweet ID is required' 
    });
  }

  try {
    // Apply authentication middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { quantity = 1 } = req.body;

    // Validation
    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ 
        error: 'Invalid quantity',
        message: 'Quantity must be a positive integer' 
      });
    }

    // Get current sweet data
    const { data: sweet, error: fetchError } = await supabase
      .from('sweets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Not found',
          message: 'Sweet not found' 
        });
      }
      console.error('Error fetching sweet:', fetchError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Error fetching sweet details' 
      });
    }

    // Check if enough quantity is available
    if (sweet.quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        message: `Only ${sweet.quantity} units available. Requested: ${quantity}` 
      });
    }

    // Update quantity (decrease)
    const newQuantity = sweet.quantity - quantity;
    const { data: updatedSweet, error: updateError } = await supabase
      .from('sweets')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating sweet quantity:', updateError);
      return res.status(500).json({ 
        error: 'Purchase failed',
        message: 'Error processing purchase' 
      });
    }

    // Calculate total cost
    const totalCost = sweet.price * quantity;

    return res.status(200).json({
      success: true,
      message: 'Purchase completed successfully',
      purchase: {
        sweet_id: id,
        sweet_name: sweet.name,
        quantity_purchased: quantity,
        unit_price: sweet.price,
        total_cost: totalCost,
        remaining_stock: newQuantity
      },
      updated_sweet: updatedSweet
    });
  } catch (authError) {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: authError.message || 'Please provide valid authentication'
    });
  }
};
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
