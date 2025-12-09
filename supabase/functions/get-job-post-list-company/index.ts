import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id from request body
    const { user_id, page = 1, limit = 20 } = await req.json();

    if (!user_id) {
      console.log("Missing user_id in request");
      return new Response(
        JSON.stringify({ success: false, message: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching mixed list for company user: ${user_id}, page: ${page}, limit: ${limit}`);

    // Get company profile for the logged-in user to retrieve tags_ids
    const { data: companyProfile, error: companyError } = await supabase
      .from("company_profiles")
      .select("tags_ids, tags")
      .eq("user_id", user_id)
      .maybeSingle();

    if (companyError) {
      console.error("Error fetching company profile:", companyError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to fetch company profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!companyProfile) {
      console.log("No company profile found for user:", user_id);
      return new Response(
        JSON.stringify({ success: false, message: "Company profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse company tags_ids (stored as comma-separated string or JSON)
    let companyTagIds: string[] = [];
    if (companyProfile.tags_ids) {
      try {
        // Try parsing as JSON array first
        companyTagIds = JSON.parse(companyProfile.tags_ids);
      } catch {
        // If not JSON, treat as comma-separated string
        companyTagIds = companyProfile.tags_ids.split(",").map((id: string) => id.trim()).filter(Boolean);
      }
    }

    console.log("Company tag IDs:", companyTagIds);

    if (companyTagIds.length === 0) {
      console.log("No tags found for company profile");
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [], 
          message: "No tags configured for company profile",
          pagination: { page, limit, total: 0 }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch posts that match any of the company's tag_ids
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    }

    // Filter posts that have matching tag_ids
    const matchingPosts = (postsData || []).filter((post: any) => {
      if (!post.tag_ids || !Array.isArray(post.tag_ids)) return false;
      return post.tag_ids.some((tagId: string) => companyTagIds.includes(tagId));
    });

    console.log(`Found ${matchingPosts.length} matching posts`);

    // Fetch job requests that match any of the company's tag_ids
    const { data: jobRequestsData, error: jobRequestsError } = await supabase
      .from("job_requests")
      .select("*")
      .eq("status", "Approved")
      .order("created_at", { ascending: false });

    if (jobRequestsError) {
      console.error("Error fetching job requests:", jobRequestsError);
    }

    // Filter job requests that have matching job_tags_ids
    const matchingJobRequests = (jobRequestsData || []).filter((job: any) => {
      if (!job.job_tags_ids || !Array.isArray(job.job_tags_ids)) return false;
      return job.job_tags_ids.some((tagId: string) => companyTagIds.includes(tagId));
    });

    console.log(`Found ${matchingJobRequests.length} matching job requests`);

    // Get all unique user_ids from posts and job requests
    const postUserIds = matchingPosts.map((p: any) => p.user_id);
    const jobUserIds = matchingJobRequests.map((j: any) => j.user_id);
    const allUserIds = [...new Set([...postUserIds, ...jobUserIds])];

    // Fetch profiles for all users
    let profilesMap: Record<string, any> = {};
    if (allUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, profile_picture_url, email")
        .in("user_id", allUserIds);

      (profilesData || []).forEach((profile: any) => {
        profilesMap[profile.user_id] = profile;
      });
    }

    // Get engagement counts for posts
    const postIds = matchingPosts.map((p: any) => p.id);
    let likesCount: Record<string, number> = {};
    let commentsCount: Record<string, number> = {};
    let sharesCount: Record<string, number> = {};

    if (postIds.length > 0) {
      const [likesRes, commentsRes, sharesRes] = await Promise.all([
        supabase.from("post_likes").select("post_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
        supabase.from("post_shares").select("post_id").in("post_id", postIds),
      ]);

      (likesRes.data || []).forEach((like: any) => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });
      (commentsRes.data || []).forEach((comment: any) => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });
      (sharesRes.data || []).forEach((share: any) => {
        sharesCount[share.post_id] = (sharesCount[share.post_id] || 0) + 1;
      });
    }

    // Transform posts with type identifier and user info
    const transformedPosts = matchingPosts.map((post: any) => ({
      type: "post",
      id: post.id,
      user_id: post.user_id,
      description: post.description,
      image_url: post.image_url,
      location: post.location,
      mentions: post.mentions,
      tag_ids: post.tag_ids,
      tags_name: post.tags_name,
      created_at: post.created_at,
      updated_at: post.updated_at,
      total_likes: likesCount[post.id] || 0,
      total_comments: commentsCount[post.id] || 0,
      total_shares: sharesCount[post.id] || 0,
      user: profilesMap[post.user_id] || null,
    }));

    // Transform job requests with type identifier and user info
    const transformedJobRequests = matchingJobRequests.map((job: any) => ({
      type: "job_request",
      id: job.id,
      user_id: job.user_id,
      job_title: job.job_title,
      job_short_description: job.job_short_description,
      job_full_description: job.job_full_description,
      job_category_names: job.job_category_names,
      job_category_type_ids: job.job_category_type_ids,
      job_urgency: job.job_urgency,
      job_budget: job.job_budget,
      job_start_date: job.job_start_date,
      job_complete_date: job.job_complete_date,
      job_location: job.job_location,
      job_latitude: job.job_latitude,
      job_longitude: job.job_longitude,
      job_special_requirements: job.job_special_requirements,
      job_tags_ids: job.job_tags_ids,
      job_tags_names: job.job_tags_names,
      job_documents_images: job.job_documents_images,
      status: job.status,
      created_at: job.created_at,
      updated_at: job.updated_at,
      user: profilesMap[job.user_id] || null,
    }));

    // Combine and sort by created_at (most recent first)
    const combinedList = [...transformedPosts, ...transformedJobRequests]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const total = combinedList.length;
    const offset = (page - 1) * limit;
    const paginatedList = combinedList.slice(offset, offset + limit);

    console.log(`Returning ${paginatedList.length} items out of ${total} total`);

    return new Response(
      JSON.stringify({
        success: true,
        data: paginatedList,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
