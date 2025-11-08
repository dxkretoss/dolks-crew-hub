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

    // Get the authenticated user (optional - posts are public)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('user_id');

    console.log('Fetching posts with limit:', limit, 'offset:', offset);

    // Build the query
    let query = supabaseClient
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user_id if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch posts', details: postsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetched posts:', posts?.length || 0);

    // Fetch engagement data for all posts
    const postIds = posts?.map(p => p.id) || [];

    if (postIds.length === 0) {
      return new Response(
        JSON.stringify({ posts: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch likes count
    const { data: likesData } = await supabaseClient
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    // Fetch comments count
    const { data: commentsData } = await supabaseClient
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds);

    // Fetch shares count
    const { data: sharesData } = await supabaseClient
      .from('post_shares')
      .select('post_id')
      .in('post_id', postIds);

    // Fetch favorites for the current user (if authenticated)
    let favoritesData = [];
    if (user) {
      const { data } = await supabaseClient
        .from('post_favorites')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', user.id);
      favoritesData = data || [];
    }

    // Aggregate counts
    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    const sharesCount: Record<string, number> = {};
    const favoritePostIds = new Set(favoritesData.map(f => f.post_id));

    likesData?.forEach(like => {
      likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
    });

    commentsData?.forEach(comment => {
      commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
    });

    sharesData?.forEach(share => {
      sharesCount[share.post_id] = (sharesCount[share.post_id] || 0) + 1;
    });

    // Enrich posts with engagement data
    const enrichedPosts = posts?.map(post => ({
      ...post,
      total_likes: likesCount[post.id] || 0,
      total_comments: commentsCount[post.id] || 0,
      total_shares: sharesCount[post.id] || 0,
      is_added_favorite: favoritePostIds.has(post.id),
    }));

    console.log('Returning enriched posts:', enrichedPosts?.length || 0);

    return new Response(
      JSON.stringify({ posts: enrichedPosts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-posts function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});