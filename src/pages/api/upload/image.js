import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Supported image formats
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Middleware to verify authentication
async function verifyAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return { error: 'No authorization token provided', status: 401 };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user, status: 200 };
  } catch (error) {
    return { error: 'Authentication failed', status: 401 };
  }
}

// Validate image file
function validateImageFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file format
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!SUPPORTED_FORMATS.includes(fileExtension)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    };
  }

  // Check MIME type
  const supportedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!supportedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a valid image file.'
    };
  }

  return { valid: true };
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    // Handle multipart form data
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // Parse form data
    const chunks = [];
    let data = '';

    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        data = Buffer.concat(chunks).toString();
        
        // Extract file from form data
        const fileMatch = data.match(/Content-Disposition: form-data; name="file"; filename="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/);
        
        if (!fileMatch) {
          return res.status(400).json({ error: 'No file found in request' });
        }

        const filename = fileMatch[1];
        const fileData = fileMatch[2];
        
        // Create file object
        const file = {
          name: filename,
          size: fileData.length,
          type: `image/${filename.split('.').pop().toLowerCase()}`,
          buffer: Buffer.from(fileData)
        };

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(file.buffer, {
          public_id: `course-image-${Date.now()}`,
          folder: 'course-images',
          resource_type: 'image',
          format: file.name.split('.').pop().toLowerCase(),
          transformation: [
            {
              quality: 'auto:good',
              fetch_format: 'auto',
            },
          ],
        });

        // Return success response with image metadata
        res.status(200).json({
          success: true,
          url: uploadResult.secure_url,
          data: {
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
            format: uploadResult.format,
            size: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
            created_at: uploadResult.created_at,
          },
          message: 'Image uploaded successfully'
        });

      } catch (parseError) {
        console.error('Form parsing error:', parseError);
        res.status(500).json({ error: 'Failed to process upload' });
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      res.status(500).json({ error: 'Upload failed' });
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
