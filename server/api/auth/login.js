const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createSupabaseClient } = require('../../supabase/client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    const supabase = createSupabaseClient();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Please provide both email and password' 
      });
    }

    // Find user by email
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (selectError || !user) {
      return res.status(400).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Invalid credentials',
        message: 'Invalid email or password' 
      });
    }

    const payload = { 
      user: { 
        id: user.id, 
        email: user.email,
        role: user.role 
      } 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({ 
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'An internal server error occurred' 
    });
  }
};