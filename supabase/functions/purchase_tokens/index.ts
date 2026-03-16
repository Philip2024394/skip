import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createClient as createStripeClient } from "https://esm.sh/@stripe/stripe-js@14"

interface RequestBody {
  tokens: number;
  priceId: string;
  price: number;
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
    const { tokens, priceId, price }: RequestBody = await req.json()

    if (!tokens || !priceId || !price) {
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

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // In a real implementation, you would integrate with Stripe here
    // For now, we'll simulate the payment process
    const stripePriceId = Deno.env.get(`STRIPE_PRICE_${priceId}`) || priceId
    
    // Create a checkout session (mock implementation)
    const mockCheckoutUrl = `https://checkout.stripe.com/pay?mock=true&price=${price}&tokens=${tokens}&userId=${user.id}`

    // Record the purchase attempt
    const { error: purchaseError } = await supabaseClient
      .from('token_purchases')
      .insert({
        user_id: user.id,
        tokens_purchased: tokens,
        price_paid: price,
        stripe_payment_id: stripePriceId,
      })

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: mockCheckoutUrl,
        tokens: tokens,
        price: price
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
