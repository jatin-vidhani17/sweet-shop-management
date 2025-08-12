const { createSupabaseServiceClient } = require('../supabase/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

module.exports = async (req, res) => {
  // Handle CORS for Vercel deployment
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST method is supported for file uploads' 
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

    const supabase = createSupabaseServiceClient();

    // Handle file upload
    const { file, fileName } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({
        error: 'Missing file data',
        message: 'Please provide file and fileName'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `sweet-${timestamp}-${fileName}`;

    // Convert base64 to buffer if needed
    let fileBuffer;
    if (typeof file === 'string' && file.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = file.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else if (typeof file === 'string') {
      // Handle base64 string
      fileBuffer = Buffer.from(file, 'base64');
    } else {
      fileBuffer = file;
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('sweets')
      .upload(uniqueFileName, fileBuffer, {
        contentType: getContentType(fileName),
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to upload image to storage'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('sweets')
      .getPublicUrl(uniqueFileName);

    return res.status(200).json({
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
        fileName: uniqueFileName
      },
      message: 'Image uploaded successfully'
    });

  } catch (authError) {
    return res.status(403).json({ 
      error: 'Authorization failed',
      message: 'Admin privileges required to upload images'
    });
  }
};

// Helper function to determine content type
function getContentType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[extension] || 'image/jpeg';
}
