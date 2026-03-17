// [04] Admin - services/admin-leads.ts
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppLead {
  id: string;
  whatsapp_e164: string;
  country_prefix: string;
  national_number: string;
  source: string;
  consent_marketing: boolean;
  created_at: string;
  last_seen_at: string;
}

export const getLeadsByCountry = async (countryCode: string) => {
  // 🔴 SUPABASE TOUCHPOINT: Filtered pull from Section [06] table
  const { data, error } = await supabase
    .from('whatsapp_leads')
    .select('*')
    .eq('country_prefix', countryCode)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as WhatsAppLead[];
};

export const getAllCountriesWithLeads = async () => {
  // 🔴 SUPABASE TOUCHPOINT: Get unique countries with lead counts
  const { data, error } = await supabase
    .from('whatsapp_leads')
    .select('country_prefix')
    .order('country_prefix');

  if (error) throw error;
  
  // Count leads per country
  const countryCounts = (data as any[]).reduce((acc, lead) => {
    const prefix = lead.country_prefix;
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {});

  return countryCounts;
};
