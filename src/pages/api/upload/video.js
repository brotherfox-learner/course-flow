import { createClient } from '@supabase/supabase-js';
import { uploadVideo } from '@/infrastructure/cloudinary';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Supported video formats
const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

// Validate video file
function validateVideoFile(file) {
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
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm'
  ];

  if (!supportedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a valid video file.'
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
    let boundary = contentType.split('boundary=')[1];
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
          type: `video/${filename.split('.').pop().toLowerCase()}`,
          buffer: Buffer.from(fileData)
        };

        // Validate file
        const validation = validateVideoFile(file);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }

        // Upload to Cloudinary
        const uploadResult = await uploadVideo(file.buffer, {
          public_id: `course-video-${Date.now()}`,
          folder: 'course-videos',
        });

        if (!uploadResult.success) {
          return res.status(500).json({ error: 'Upload failed: ' + uploadResult.error });
        }

        // Return success response with video metadata
        res.status(200).json({
          success: true,
          data: uploadResult.data,
          message: 'Video uploaded successfully'
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
