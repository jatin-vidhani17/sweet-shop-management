const { createSupabaseClient } = require('../../supabase/client');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');

module.exports = async (req, res) => {
  const supabase = createSupabaseClient();
  
  try {
    // Apply authentication middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { id } = req.query;

    // Validate sweet ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid sweet ID',
        message: 'Sweet ID must be a valid number'
      });
    }

    const sweetId = parseInt(id);

    if (req.method === 'GET') {
      // Get sweet by ID
      const { data: sweet, error } = await supabase
        .from('sweets')
        .select('*')
        .eq('id', sweetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Sweet not found',
            message: `No sweet found with ID ${sweetId}`
          });
        }
        console.error('Error fetching sweet:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Error fetching sweet'
        });
      }

      return res.status(200).json({
        success: true,
        data: sweet
      });

    } else if (req.method === 'PUT') {
      // Apply admin middleware for updates
      try {
        await new Promise((resolve, reject) => {
          adminMiddleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (adminError) {
        return res.status(403).json({
          error: 'Admin access required',
          message: adminError.message || 'Only admin users can update sweets'
        });
      }

      const { name, category, price, quantity, description, image_url, ingredients, is_active } = req.body;

      // Validate required fields
      if (!name && !category && price === undefined && quantity === undefined && !description && !image_url && !ingredients && is_active === undefined) {
        return res.status(400).json({
          error: 'No fields to update',
          message: 'At least one field must be provided for update'
        });
      }

      // Build update object
      const updateData = {};
      
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({
            error: 'Invalid name',
            message: 'Name must be a non-empty string'
          });
        }
        updateData.name = name.trim();
      }

      if (category !== undefined) {
        if (typeof category !== 'string' || category.trim().length === 0) {
          return res.status(400).json({
            error: 'Invalid category',
            message: 'Category must be a non-empty string'
          });
        }
        updateData.category = category.trim();
      }

      if (price !== undefined) {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
          return res.status(400).json({
            error: 'Invalid price',
            message: 'Price must be a non-negative number'
          });
        }
        updateData.price = numPrice;
      }

      if (quantity !== undefined) {
        const numQuantity = parseInt(quantity);
        if (isNaN(numQuantity) || numQuantity < 0) {
          return res.status(400).json({
            error: 'Invalid quantity',
            message: 'Quantity must be a non-negative integer'
          });
        }
        updateData.quantity = numQuantity;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (image_url !== undefined) {
        updateData.image_url = image_url;
      }

      if (ingredients !== undefined) {
        updateData.ingredients = ingredients;
      }

      if (is_active !== undefined) {
        updateData.is_active = is_active;
      }

      updateData.updated_at = new Date().toISOString();

      // Update sweet
      const { data: updatedSweet, error } = await supabase
        .from('sweets')
        .update(updateData)
        .eq('id', sweetId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Sweet not found',
            message: `No sweet found with ID ${sweetId}`
          });
        }
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Sweet name already exists',
            message: 'A sweet with this name already exists'
          });
        }
        console.error('Error updating sweet:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Error updating sweet'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Sweet updated successfully',
        data: updatedSweet
      });

    } else if (req.method === 'DELETE') {
      // Apply admin middleware for deletions
      try {
        await new Promise((resolve, reject) => {
          adminMiddleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (adminError) {
        return res.status(403).json({
          error: 'Admin access required',
          message: adminError.message || 'Only admin users can delete sweets'
        });
      }

      // Check if sweet exists
      const { data: existingSweet, error: checkError } = await supabase
        .from('sweets')
        .select('id, name')
        .eq('id', sweetId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Sweet not found',
            message: `No sweet found with ID ${sweetId}`
          });
        }
        console.error('Error checking sweet:', checkError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Error checking sweet existence'
        });
      }

      // Delete sweet
      const { error: deleteError } = await supabase
        .from('sweets')
        .delete()
        .eq('id', sweetId);

      if (deleteError) {
        console.error('Error deleting sweet:', deleteError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Error deleting sweet'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Sweet "${existingSweet.name}" deleted successfully`,
        data: { id: sweetId, name: existingSweet.name }
      });

    } else {
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: 'Only GET, PUT, and DELETE requests are allowed'
      });
    }

  } catch (authError) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: authError.message || 'Please provide valid authentication'
    });
  }
};
