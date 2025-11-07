import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarkInterestRequest {
  event_id: string;
  interest_type: 'yes' | 'no' | 'maybe';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Mark Event Interest function called');

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const body: MarkInterestRequest = await req.json();
    const { event_id, interest_type } = body;

    if (!event_id || !interest_type) {
      console.error('Missing required fields:', { event_id, interest_type });
      return new Response(
        JSON.stringify({ error: 'event_id and interest_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate interest_type
    if (!['yes', 'no', 'maybe'].includes(interest_type)) {
      console.error('Invalid interest_type:', interest_type);
      return new Response(
        JSON.stringify({ error: 'interest_type must be "yes", "no", or "maybe"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the event exists
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('id')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Event exists:', event_id);

    // Upsert the interest (insert or update if exists)
    const { data, error } = await supabaseClient
      .from('event_interests')
      .upsert(
        {
          event_id: event_id,
          user_id: user.id,
          interest_type: interest_type,
        },
        {
          onConflict: 'event_id,user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting interest:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Interest marked successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Interest marked successfully',
        data: data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});