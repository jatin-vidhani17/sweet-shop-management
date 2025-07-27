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
    const sweetId = req.query.id || req.params?.id;

    if (!sweetId) {
      return res.status(400).json({ message: 'Sweet ID is required' });
    }

    // PUT /api/sweets/[id] - Update sweet
    if (req.method === 'PUT') {
      try {
        const user = verifyToken(req);
        
        const { name, category, price, quantity, description, ingredients, image, is_active } = req.body;

        // Prepare update data
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (category !== undefined) updateData.category = category;
        if (price !== undefined) {
          if (price < 0) {
            return res.status(400).json({ message: 'Price must be non-negative' });
          }
          updateData.price = parseFloat(price);
        }
        if (quantity !== undefined) {
          if (quantity < 0) {
            return res.status(400).json({ message: 'Quantity must be non-negative' });
          }
          updateData.quantity = parseInt(quantity);
        }
        if (description !== undefined) updateData.description = description.trim();
        if (ingredients !== undefined) updateData.ingredients = ingredients;
        if (image !== undefined) updateData.image = image;
        if (is_active !== undefined) updateData.is_active = is_active;
        
        updateData.updated_at = new Date().toISOString();

        const { data: updatedSweet, error } = await supabase
          .from('sweets')
          .update(updateData)
          .eq('id', sweetId)
          .select()
          .single();

        if (error) {
          console.error('Error updating sweet:', error);
          return res.status(500).json({ message: 'Error updating sweet' });
        }

        if (!updatedSweet) {
          return res.status(404).json({ message: 'Sweet not found' });
        }

        return res.status(200).json(updatedSweet);
      } catch (authError) {
        return res.status(401).json({ message: authError.message });
      }
    }

    // DELETE /api/sweets/[id] - Delete sweet (Admin only)
    if (req.method === 'DELETE') {
      try {
        const user = verifyToken(req);
        
        if (user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }

        const { data: deletedSweet, error } = await supabase
          .from('sweets')
          .delete()
          .eq('id', sweetId)
          .select()
          .single();

        if (error) {
          console.error('Error deleting sweet:', error);
          return res.status(500).json({ message: 'Error deleting sweet' });
        }

        if (!deletedSweet) {
          return res.status(404).json({ message: 'Sweet not found' });
        }

        return res.status(200).json({ message: 'Sweet deleted successfully', sweet: deletedSweet });
      } catch (authError) {
        if (authError.message === 'Admin access required') {
          return res.status(403).json({ message: authError.message });
        }
        return res.status(401).json({ message: authError.message });
      }
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error in sweet ID API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
