import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      image_base64,
      description,
      tagged_user_ids,
      location,
      mentions,
      posted_by_full_name,
    } = await req.json();

    console.log('Creating post for user:', user.id);

    let imageUrl = null;

    // Handle image upload if provided
    if (image_base64) {
      try {
        // Remove data URL prefix if present
        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('post-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          return new Response(
            JSON.stringify({ error: 'Failed to upload image', details: uploadError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
      } catch (imageError) {
        console.error('Image processing error:', imageError);
        return new Response(
          JSON.stringify({ error: 'Failed to process image', details: String(imageError) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create the post
    const { data: post, error: postError } = await supabaseClient
      .from('posts')
      .insert({
        user_id: user.id,
        posted_by_full_name: posted_by_full_name || 'Anonymous',
        description: description || null,
        image_url: imageUrl,
        location: location || null,
        tagged_user_ids: tagged_user_ids || [],
        mentions: mentions || [],
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return new Response(
        JSON.stringify({ error: 'Failed to create post', details: postError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Post created successfully:', post.id);

    return new Response(
      JSON.stringify({ success: true, post }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-post function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});