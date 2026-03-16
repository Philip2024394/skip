// WhatsApp Number Collection Service
// Simplified service for collecting and managing WhatsApp numbers from app users
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppLead {
  id: string;
  name: string;
  phone: string;
  whatsapp_number?: string;
  email?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  verified: boolean;
  whatsapp_verified: boolean;
  status: 'pending' | 'verified' | 'active' | 'inactive' | 'blocked';
  source: 'app_signup' | 'profile_update' | 'manual_import' | 'api_import';
  profile_completion: number;
  interests?: string[];
  language?: string;
  age_range?: string;
  gender?: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCollectionStats {
  totalUsers: number;
  verifiedNumbers: number;
  pendingVerification: number;
  todaySignups: number;
  weeklyGrowth: number;
  verificationRate: number;
  topSources: Array<{ source: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
}

export class WhatsAppCollectionService {
  // Lead Management
  static async createLead(leadData: Partial<WhatsAppLead>): Promise<WhatsAppLead | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('whatsapp_leads')
        .insert([{
          ...leadData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating WhatsApp lead:', error);
      return null;
    }
  }

  static async updateLead(leadId: string, updates: Partial<WhatsAppLead>): Promise<WhatsAppLead | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('whatsapp_leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating WhatsApp lead:', error);
      return null;
    }
  }

  static async getLeadById(leadId: string): Promise<WhatsAppLead | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('whatsapp_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching WhatsApp lead:', error);
      return null;
    }
  }

  static async getAllLeads(filters?: {
    status?: string;
    verified?: boolean;
    source?: string;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: WhatsAppLead[]; total: number }> {
    try {
      let query = (supabase as any)
        .from('whatsapp_leads')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.verified !== undefined) {
        query = query.eq('whatsapp_verified', filters.verified);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        leads: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching WhatsApp leads:', error);
      return { leads: [], total: 0 };
    }
  }

  // Verification Management
  static async verifyLead(leadId: string, verified: boolean): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('whatsapp_leads')
        .update({ 
          whatsapp_verified: verified,
          verified: verified,
          status: verified ? 'verified' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error verifying lead:', error);
      return false;
    }
  }

  static async bulkVerifyLeads(leadIds: string[]): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from('whatsapp_leads')
        .update({
          whatsapp_verified: true,
          verified: true,
          status: 'verified',
          updated_at: new Date().toISOString()
        })
        .in('id', leadIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk verifying leads:', error);
      return false;
    }
  }

  // Statistics
  static async getCollectionStats(): Promise<WhatsAppCollectionStats> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get all leads
      const { data: leads, error: leadsError } = await (supabase as any)
        .from('whatsapp_leads')
        .select('*');

      if (leadsError) throw leadsError;

      const totalUsers = leads?.length || 0;
      const verifiedNumbers = leads?.filter(l => l.whatsapp_verified).length || 0;
      const pendingVerification = leads?.filter(l => !l.whatsapp_verified && l.status === 'pending').length || 0;
      const todaySignups = leads?.filter(l => l.created_at.startsWith(today)).length || 0;
      const weeklyGrowth = leads?.filter(l => l.created_at >= weekAgo).length || 0;
      const verificationRate = totalUsers > 0 ? (verifiedNumbers / totalUsers) * 100 : 0;

      // Calculate top sources
      const sourceCounts = leads?.reduce((acc: any, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {}) || {};

      const topSources = Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate top locations
      const locationCounts = leads
        ?.filter(l => l.location)
        .reduce((acc: any, lead) => {
          acc[lead.location!] = (acc[lead.location!] || 0) + 1;
          return acc;
        }, {}) || {};

      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalUsers,
        verifiedNumbers,
        pendingVerification,
        todaySignups,
        weeklyGrowth,
        verificationRate,
        topSources,
        topLocations
      };
    } catch (error) {
      console.error('Error fetching collection stats:', error);
      return {
        totalUsers: 0,
        verifiedNumbers: 0,
        pendingVerification: 0,
        todaySignups: 0,
        weeklyGrowth: 0,
        verificationRate: 0,
        topSources: [],
        topLocations: []
      };
    }
  }

  // Export Functions
  static async exportLeadsToCSV(filters?: {
    status?: string;
    verified?: boolean;
    source?: string;
    location?: string;
  }): Promise<string> {
    try {
      const { leads } = await this.getAllLeads(filters);
      
      const headers = [
        'ID', 'Name', 'Phone', 'WhatsApp Number', 'Email', 'Location', 
        'Status', 'Verified', 'Source', 'Profile Completion', 'Language',
        'Join Date', 'Last Active'
      ];
      
      const csvContent = [
        headers.join(','),
        ...leads.map(lead => [
          lead.id,
          lead.name,
          lead.phone,
          lead.whatsapp_number || '',
          lead.email || '',
          lead.location || '',
          lead.status,
          lead.verified,
          lead.source,
          lead.profile_completion,
          lead.language || '',
          lead.created_at,
          lead.last_active
        ].join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting leads to CSV:', error);
      return '';
    }
  }
}

export default WhatsAppCollectionService;
