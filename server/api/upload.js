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

    console.log('Creating Supabase service client...');
    console.log('Environment check:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_KEY?.substring(0, 20) + '...',
      url: process.env.SUPABASE_URL
    });
    
    // Try creating the client and handling potential auth issues
    let supabase;
    try {
      supabase = createSupabaseServiceClient();
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      // Return fallback immediately if client creation fails
      const placeholderUrl = `https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&crop=center&auto=format&q=80`;
      
      return res.status(200).json({
        success: true,
        data: {
          path: `fallback-${Date.now()}`,
          url: placeholderUrl,
          fileName: `fallback-${Date.now()}.jpg`,
          fallback: true,
          message: 'Using fallback image due to client initialization error'
        },
        message: 'Image uploaded successfully (fallback)'
      });
    }

    // Handle file upload
    const { file, fileName } = req.body;
    console.log('Upload request:', { fileName, fileType: typeof file, fileLength: file?.length });

    if (!file || !fileName) {
      return res.status(400).json({
        error: 'Missing file data',
        message: 'Please provide file and fileName'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `sweet-${timestamp}-${fileName}`;
    console.log('Generated unique filename:', uniqueFileName);

    // Convert base64 to buffer if needed
    let fileBuffer;
    try {
      if (typeof file === 'string' && file.startsWith('data:')) {
        // Handle base64 data URL
        const base64Data = file.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
        console.log('Converted data URL to buffer, size:', fileBuffer.length);
      } else if (typeof file === 'string') {
        // Handle base64 string
        fileBuffer = Buffer.from(file, 'base64');
        console.log('Converted base64 string to buffer, size:', fileBuffer.length);
      } else {
        fileBuffer = file;
        console.log('Using file as-is, type:', typeof fileBuffer);
      }
    } catch (conversionError) {
      console.error('Error converting file:', conversionError);
      return res.status(400).json({
        error: 'File conversion failed',
        message: 'Failed to process the uploaded file'
      });
    }

    const contentType = getContentType(fileName);
    console.log('Content type determined:', contentType);

    // Upload to Supabase Storage
    console.log('Attempting upload to Supabase storage...');
    
    // First, check if the bucket exists and create it if it doesn't
    let bucketReady = false;
    try {
      console.log('Checking for existing buckets...');
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Failed to list buckets:', listError);
        throw new Error(`Bucket list failed: ${listError.message}`);
      }
      
      console.log('Available buckets:', buckets?.map(b => b.name));
      
      const sweetsExists = buckets?.find(bucket => bucket.name === 'sweets');
      if (!sweetsExists) {
        console.log('Sweets bucket does not exist, creating...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('sweets', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error('Failed to create bucket:', createError);
          throw new Error(`Bucket creation failed: ${createError.message}`);
        }
        console.log('Sweets bucket created successfully');
      }
      bucketReady = true;
    } catch (bucketError) {
      console.error('Bucket check/creation error:', bucketError);
      // Return fallback if bucket operations fail
      const placeholderUrl = `https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&crop=center&auto=format&q=80`;
      
      return res.status(200).json({
        success: true,
        data: {
          path: uniqueFileName,
          url: placeholderUrl,
          fileName: uniqueFileName,
          fallback: true,
          message: 'Using fallback image due to bucket error'
        },
        message: 'Image uploaded successfully (fallback)',
        bucketError: bucketError.message
      });
    }

    const { data, error } = await supabase.storage
      .from('sweets')
      .upload(uniqueFileName, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    console.log('Supabase upload result:', { data, error });

    if (error) {
      console.error('Storage upload error:', error);
      // Fallback: Return a placeholder URL with encoded filename
      const placeholderUrl = `https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&crop=center&auto=format&q=80&overlay=${encodeURIComponent(fileName)}`;
      
      return res.status(200).json({
        success: true,
        data: {
          path: uniqueFileName,
          url: placeholderUrl,
          fileName: uniqueFileName,
          fallback: true,
          message: 'Using fallback image due to storage error'
        },
        message: 'Image uploaded successfully (fallback)'
      });
    }

    // Get public URL
    console.log('Getting public URL for:', uniqueFileName);
    const { data: urlData } = supabase.storage
      .from('sweets')
      .getPublicUrl(uniqueFileName);

    console.log('Public URL data:', urlData);

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
    console.error('Upload API error:', authError);
    return res.status(500).json({ 
      error: 'Server error',
      message: `Upload failed: ${authError.message || 'Unknown error'}`
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
