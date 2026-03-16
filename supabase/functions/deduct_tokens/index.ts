import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface RequestBody {
  p_user_id: string;
  p_tokens: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { p_user_id, p_tokens }: RequestBody = await req.json()

    if (!p_user_id || !p_tokens || p_tokens <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check user's current token balance
    const { data: userTokens, error: fetchError } = await supabaseClient
      .from('user_tokens')
      .select('tokens_balance')
      .eq('user_id', p_user_id)
      .single()

    if (fetchError || !userTokens) {
      return new Response(
        JSON.stringify({ error: 'User tokens not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (userTokens.tokens_balance < p_tokens) {
      return new Response(
        JSON.stringify({ error: 'Insufficient tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Deduct tokens
    const { error: updateError } = await supabaseClient
      .from('user_tokens')
      .update({ 
        tokens_balance: userTokens.tokens_balance - p_tokens,
        total_gifts_sent: supabaseClient.rpc('increment', { x: 1 })
      })
      .eq('user_id', p_user_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to deduct tokens' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, new_balance: userTokens.tokens_balance - p_tokens }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
