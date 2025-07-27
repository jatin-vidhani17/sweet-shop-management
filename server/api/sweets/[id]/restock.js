const { createSupabaseClient } = require('../../../supabase/client');
const { authMiddleware, adminMiddleware } = require('../../../middleware/auth');

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

    // Apply admin middleware
    await new Promise((resolve, reject) => {
      adminMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { quantity } = req.body;

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

    // Update quantity (increase)
    const newQuantity = sweet.quantity + quantity;
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
        error: 'Restock failed',
        message: 'Error processing restock' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Restock completed successfully',
      restock: {
        sweet_id: id,
        sweet_name: sweet.name,
        quantity_added: quantity,
        previous_stock: sweet.quantity,
        new_stock: newQuantity
      },
      updated_sweet: updatedSweet
    });
  } catch (authError) {
    return res.status(403).json({ 
      error: 'Authorization failed',
      message: 'Admin privileges required for restocking'
    });
  }
};
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
