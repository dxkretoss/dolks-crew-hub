import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const {
      job_title,
      job_short_description,
      job_category_type_ids,
      job_urgency,
      job_full_description,
      job_start_date,
      job_location,
      job_latitude,
      job_longitude,
      job_complete_date,
      job_special_requirements,
      job_budget,
      job_documents_images_base64, // Array of base64 encoded images
      job_tags_ids,
      job_consent,
    } = await req.json();

    console.log('Creating job request for user:', user.id);
    console.log('Job title:', job_title);

    // Fetch category names based on job_category_type_ids
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('categories')
      .select('id, name')
      .in('id', job_category_type_ids);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch categories' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Map category IDs to names
    const job_category_names = job_category_type_ids.map((id: string) => {
      const category = categories?.find((cat) => cat.id === id);
      return category?.name || '';
    });

    // Fetch tag names if tag IDs are provided
    let job_tags_names: string[] = [];
    if (job_tags_ids && job_tags_ids.length > 0) {
      const { data: tags, error: tagsError } = await supabaseClient
        .from('tags')
        .select('id, name')
        .in('id', job_tags_ids);

      if (tagsError) {
        console.error('Error fetching tags:', tagsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch tags' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      job_tags_names = job_tags_ids.map((id: string) => {
        const tag = tags?.find((t) => t.id === id);
        return tag?.name || '';
      });
    }

    // Handle document/image uploads if provided
    let uploadedImageUrls: string[] = [];
    if (job_documents_images_base64 && job_documents_images_base64.length > 0) {
      for (let i = 0; i < job_documents_images_base64.length; i++) {
        const imageBase64 = job_documents_images_base64[i];
        
        try {
          // Extract base64 data
          const base64Data = imageBase64.split(',')[1] || imageBase64;
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Generate unique filename
          const fileName = `${user.id}/${Date.now()}_${i}.jpg`;
          
          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('job-documents')
            .upload(fileName, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabaseClient
            .storage
            .from('job-documents')
            .getPublicUrl(fileName);

          uploadedImageUrls.push(urlData.publicUrl);
          console.log('Uploaded image:', urlData.publicUrl);
        } catch (error) {
          console.error('Error processing image:', error);
          // Continue with other images even if one fails
        }
      }
    }

    // Insert job request
    const { data: jobRequest, error: insertError } = await supabaseClient
      .from('job_requests')
      .insert({
        user_id: user.id,
        job_title,
        job_short_description,
        job_category_type_ids,
        job_category_names,
        job_urgency,
        job_full_description,
        job_start_date,
        job_location,
        job_latitude,
        job_longitude,
        job_complete_date,
        job_special_requirements,
        job_budget: job_budget || null,
        job_documents_images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        job_tags_ids: job_tags_ids || null,
        job_tags_names: job_tags_names.length > 0 ? job_tags_names : null,
        job_consent: job_consent || false,
        status: 'Approved',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating job request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create job request', details: insertError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Job request created successfully:', jobRequest.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_request: jobRequest,
        message: 'Job request created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});