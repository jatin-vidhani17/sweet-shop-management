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
    const customerId = req.user.id;

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

    // Record sale in sales table
    const { data: saleRecord, error: saleError } = await supabase
      .from('sales')
      .insert([{
        sweet_id: id,
        customer_id: customerId,
        quantity: quantity,
        unit_price: sweet.price,
        total_price: totalCost,
        sale_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (saleError) {
      console.error('Error recording sale:', saleError);
      // Don't fail the purchase if sale recording fails, just log it
    }

    // Record stock history
    const { error: stockHistoryError } = await supabase
      .from('stock_history')
      .insert([{
        sweet_id: id,
        admin_id: customerId, // In this case, customer making purchase
        action_type: 'sale',
        quantity_change: -quantity,
        previous_quantity: sweet.quantity,
        new_quantity: newQuantity,
        notes: `Sale to customer: ${quantity} units purchased`
      }]);

    if (stockHistoryError) {
      console.error('Error recording stock history:', stockHistoryError);
      // Don't fail the purchase if stock history recording fails
    }

    return res.status(200).json({
      success: true,
      message: 'Purchase completed successfully',
      purchase: {
        sweet_id: id,
        sweet_name: sweet.name,
        quantity_purchased: quantity,
        unit_price: sweet.price,
        total_cost: totalCost,
        remaining_stock: newQuantity,
        sale_recorded: saleRecord ? true : false
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
