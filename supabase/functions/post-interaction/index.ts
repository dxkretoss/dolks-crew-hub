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

    const { post_id, action, comment_text } = await req.json();

    if (!post_id || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: post_id and action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} for post ${post_id} by user ${user.id}`);

    let result;

    switch (action) {
      case 'like':
        // Add like (or remove if already exists)
        const { data: existingLike } = await supabaseClient
          .from('post_likes')
          .select('id')
          .eq('post_id', post_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingLike) {
          // Unlike
          const { error: unlikeError } = await supabaseClient
            .from('post_likes')
            .delete()
            .eq('id', existingLike.id);

          if (unlikeError) {
            throw unlikeError;
          }
          result = { action: 'unliked', liked: false };
        } else {
          // Like
          const { error: likeError } = await supabaseClient
            .from('post_likes')
            .insert({ post_id, user_id: user.id });

          if (likeError) {
            throw likeError;
          }
          result = { action: 'liked', liked: true };
        }
        break;

      case 'comment':
        if (!comment_text) {
          return new Response(
            JSON.stringify({ error: 'comment_text is required for comment action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: comment, error: commentError } = await supabaseClient
          .from('post_comments')
          .insert({
            post_id,
            user_id: user.id,
            comment_text,
          })
          .select()
          .single();

        if (commentError) {
          throw commentError;
        }
        result = { action: 'commented', comment };
        break;

      case 'share':
        // Add share (or remove if already exists)
        const { data: existingShare } = await supabaseClient
          .from('post_shares')
          .select('id')
          .eq('post_id', post_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingShare) {
          // Unshare
          const { error: unshareError } = await supabaseClient
            .from('post_shares')
            .delete()
            .eq('id', existingShare.id);

          if (unshareError) {
            throw unshareError;
          }
          result = { action: 'unshared', shared: false };
        } else {
          // Share
          const { error: shareError } = await supabaseClient
            .from('post_shares')
            .insert({ post_id, user_id: user.id });

          if (shareError) {
            throw shareError;
          }
          result = { action: 'shared', shared: true };
        }
        break;

      case 'favorite':
        // Add to favorites (or remove if already exists)
        const { data: existingFavorite } = await supabaseClient
          .from('post_favorites')
          .select('id')
          .eq('post_id', post_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingFavorite) {
          // Remove from favorites
          const { error: unfavoriteError } = await supabaseClient
            .from('post_favorites')
            .delete()
            .eq('id', existingFavorite.id);

          if (unfavoriteError) {
            throw unfavoriteError;
          }
          result = { action: 'unfavorited', favorited: false };
        } else {
          // Add to favorites
          const { error: favoriteError } = await supabaseClient
            .from('post_favorites')
            .insert({ post_id, user_id: user.id });

          if (favoriteError) {
            throw favoriteError;
          }
          result = { action: 'favorited', favorited: true };
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Valid actions: like, comment, share, favorite' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Interaction result:', result);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in post-interaction function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});