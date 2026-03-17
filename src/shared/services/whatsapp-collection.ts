// WhatsApp Collection API Endpoints
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WhatsAppCollectionService } from '@/lib/whatsapp-collection'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method, url } = req
    const urlObj = new URL(url)
    const path = urlObj.pathname
    const searchParams = urlObj.searchParams

    // Parse request body for POST/PUT requests
    let body = {}
    if (method === 'POST' || method === 'PUT') {
      body = await req.json()
    }

    // Route handling
    if (path === '/api/whatsapp-collection/leads' && method === 'GET') {
      // Get leads with filters and pagination
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || ''
      const verified = searchParams.get('verified')
      const source = searchParams.get('source') || ''
      const location = searchParams.get('location') || ''

      const filters: any = {}
      if (status) filters.status = status
      if (verified !== null) filters.verified = verified === 'true'
      if (source) filters.source = source
      if (location) filters.location = location
      if (search) filters.search = search

      const result = await WhatsAppCollectionService.getAllLeads({
        ...filters,
        limit,
        offset
      })

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/api/whatsapp-collection/leads' && method === 'POST') {
      // Create new lead
      const lead = await WhatsAppCollectionService.createLead(body)
      
      return new Response(
        JSON.stringify({ success: true, lead }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path.startsWith('/api/whatsapp-collection/leads/') && method === 'GET') {
      // Get specific lead
      const leadId = path.split('/').pop()
      const lead = await WhatsAppCollectionService.getLeadById(leadId)
      
      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ lead }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path.startsWith('/api/whatsapp-collection/leads/') && method === 'PUT') {
      // Update lead
      const leadId = path.split('/').pop()
      const lead = await WhatsAppCollectionService.updateLead(leadId, body)
      
      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, lead }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path.startsWith('/api/whatsapp-collection/leads/') && method === 'DELETE') {
      // Delete lead
      const leadId = path.split('/').pop()
      const success = await WhatsAppCollectionService.updateLead(leadId, { status: 'blocked' })
      
      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/api/whatsapp-collection/verify' && method === 'POST') {
      // Verify lead
      const { leadId, verified } = body
      const success = await WhatsAppCollectionService.verifyLead(leadId, verified)
      
      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/api/whatsapp-collection/bulk-verify' && method === 'POST') {
      // Bulk verify leads
      const { leadIds } = body
      const success = await WhatsAppCollectionService.bulkVerifyLeads(leadIds)
      
      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/api/whatsapp-collection/stats' && method === 'GET') {
      // Get collection statistics
      const stats = await WhatsAppCollectionService.getCollectionStats()
      
      return new Response(
        JSON.stringify({ stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === '/api/whatsapp-collection/export' && method === 'GET') {
      // Export leads to CSV
      const status = searchParams.get('status') || ''
      const verified = searchParams.get('verified')
      const source = searchParams.get('source') || ''
      const location = searchParams.get('location') || ''

      const filters: any = {}
      if (status) filters.status = status
      if (verified !== null) filters.verified = verified === 'true'
      if (source) filters.source = source
      if (location) filters.location = location

      const csv = await WhatsAppCollectionService.exportLeadsToCSV(filters)
      
      return new Response(
        csv,
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="whatsapp-leads.csv"'
          } 
        }
      )
    }

    // Unknown endpoint
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WhatsApp Collection API Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
