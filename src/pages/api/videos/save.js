import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const {
      lesson_id,
      title,
      public_id,
      video_url,
      thumbnail_url,
      duration,
      format,
      size,
      width,
      height
    } = req.body;

    // Validate required fields
    if (!lesson_id || !title || !public_id || !video_url) {
      return res.status(400).json({ 
        error: 'Missing required fields: lesson_id, title, public_id, video_url' 
      });
    }

    // Check if lesson exists
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id')
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Insert video metadata
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        lesson_id,
        title,
        public_id,
        video_url,
        thumbnail_url: thumbnail_url || null,
        duration: duration || null,
        format: format || null,
        size: size || null,
        width: width || null,
        height: height || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (videoError) {
      console.error('Video insert error:', videoError);
      return res.status(500).json({ error: 'Failed to save video metadata' });
    }

    // Update lesson to mark it has video
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ 
        has_video: true,
        video_id: video.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', lesson_id);

    if (updateError) {
      console.error('Lesson update error:', updateError);
      // Don't fail the request, but log the error
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        id: video.id,
        lesson_id: video.lesson_id,
        title: video.title,
        public_id: video.public_id,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        created_at: video.created_at,
      },
      message: 'Video metadata saved successfully'
    });

  } catch (error) {
    console.error('Save video handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
