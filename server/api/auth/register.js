const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createSupabaseClient } = require('../../supabase/client');

module.exports = async (req, res) => {
  // Handle CORS for Vercel deployment
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    const supabase = createSupabaseClient();
    const { name, email, role = 'customer', password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Missing fields',
        message: 'Please provide all required fields: name, email, password, confirmPassword' 
      });
    }

    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: 'Role must be either "customer" or "admin"' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Password mismatch',
        message: "Passwords don't match" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Weak password',
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Error checking user existence' 
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User exists',
        message: 'User with that email already exists' 
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        role, 
        password: hashedPassword 
      }])
      .select('id, name, email, role')
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return res.status(500).json({ 
        error: 'Registration failed',
        message: 'Error creating user account' 
      });
    }

    // Generate JWT token
    const payload = { 
      user: { 
        id: newUser.id, 
        email: newUser.email,
        role: newUser.role 
      } 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({ 
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Error in register:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: 'An internal server error occurred' 
    });
  }
};