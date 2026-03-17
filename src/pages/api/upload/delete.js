import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import pool from '@/infrastructure/db';

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

// Delete file from Cloudinary
async function deleteFromCloudinary(publicId, resourceType = 'auto') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return {
      success: result.result === 'ok',
      data: result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update database to remove file references
async function updateDatabaseReferences(publicId, pool) {
  try {
    // Clear cover_img_url on courses if it contains the publicId
    await pool.query(
      `UPDATE courses SET cover_img_url = NULL, updated_at = NOW()
       WHERE cover_img_url LIKE '%' || $1 || '%'`,
      [publicId]
    );

    // Clear vdo_trailer_url on courses if it contains the publicId
    await pool.query(
      `UPDATE courses SET vdo_trailer_url = NULL, updated_at = NOW()
       WHERE vdo_trailer_url LIKE '%' || $1 || '%'`,
      [publicId]
    );

    // Clear vdo_url on sub_lessons if it contains the publicId
    await pool.query(
      `UPDATE sub_lessons SET vdo_url = NULL, updated_at = NOW()
       WHERE vdo_url LIKE '%' || $1 || '%'`,
      [publicId]
    );

    return { success: true };
  } catch (error) {
    console.error('Database update error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const { public_id, resource_type = 'auto' } = req.body;

    // Validate input
    if (!public_id) {
      return res.status(400).json({ 
        error: 'Missing required field: public_id' 
      });
    }

    // Delete from Cloudinary
    const cloudinaryResult = await deleteFromCloudinary(public_id, resource_type);
    
    if (!cloudinaryResult.success) {
      return res.status(500).json({ 
        error: 'Failed to delete file from Cloudinary',
        details: cloudinaryResult.error 
      });
    }

    // Update database references
    const dbResult = await updateDatabaseReferences(public_id, pool);
    
    if (!dbResult.success) {
      console.error('Database update failed:', dbResult.error);
      // Don't fail the request, but log the error
    }

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: {
        public_id: public_id,
        cloudinary_result: cloudinaryResult.data,
        database_updated: dbResult.success
      }
    });

  } catch (error) {
    console.error('Delete handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
