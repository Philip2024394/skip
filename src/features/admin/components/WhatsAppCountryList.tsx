// [04] Admin - components/WhatsAppCountryList.tsx
import React, { useState, useEffect } from 'react';
import { getLeadsByCountry, getAllCountriesWithLeads, WhatsAppLead } from '../services/admin-leads';
import { openWhatsAppChat, formatWhatsAppNumber, getCountryFlag } from '../utils/whatsapp-trigger';
import { toast } from 'sonner';

export const WhatsAppCountryList = () => {
  const [activeTab, setActiveTab] = useState('+27'); // Default to SA
  const [leads, setLeads] = useState<WhatsAppLead[]>([]);
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // 🔴 Trigger Diamond Guard Sync
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await getLeadsByCountry(activeTab);
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads for this country');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountryCounts = async () => {
    try {
      const counts = await getAllCountriesWithLeads();
      setCountryCounts(counts);
    } catch (error) {
      console.error('Error fetching country counts:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [activeTab]);

  useEffect(() => {
    fetchCountryCounts();
  }, []);

  const availableCountries = Object.keys(countryCounts).sort();

  const getCountryName = (code: string) => {
    const names: Record<string, string> = {
      '+27': 'South Africa',
      '+44': 'United Kingdom',
      '+1': 'United States',
      '+62': 'Indonesia',
      '+91': 'India',
      '+33': 'France',
      '+49': 'Germany',
      '+81': 'Japan',
      '+86': 'China',
      '+55': 'Brazil',
    };
    return names[code] || 'Unknown';
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Geographic Lead Organizer</h3>
        <div className="text-sm text-slate-500">
          Total Countries: {availableCountries.length}
        </div>
      </div>

      {/* Country Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {availableCountries.length > 0 ? (
          availableCountries.map(code => (
            <button
              key={code}
              onClick={() => setActiveTab(code)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === code
                ? 'bg-black text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
              {getCountryFlag(code)} {code} ({countryCounts[code]})
            </button>
          ))
        ) : (
          <div className="text-slate-500 text-sm">No leads available</div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-slate-600">Loading leads...</span>
        </div>
      )}

      {/* Leads Table */}
      {!loading && (
        <>
          <div className="mb-4">
            <h4 className="font-semibold text-slate-900">
              {getCountryFlag(activeTab)} {getCountryName(activeTab)} ({activeTab})
            </h4>
            <p className="text-sm text-slate-500">{leads.length} leads available</p>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400 uppercase border-b">
                <th className="pb-3">WhatsApp Number</th>
                <th className="pb-3">National Number</th>
                <th className="pb-3">Date Captured</th>
                <th className="pb-3">Source</th>
                <th className="pb-3">Consent</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.length > 0 ? (
                leads.map(lead => (
                  <tr key={lead.id} className="text-sm">
                    <td className="py-3 font-mono">
                      {formatWhatsAppNumber(lead.country_prefix, lead.national_number)}
                    </td>
                    <td className="py-3 text-slate-500 font-mono">
                      {lead.national_number}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${lead.consent_marketing
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {lead.consent_marketing ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openWhatsAppChat(lead.country_prefix, lead.national_number)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold transition-colors"
                      >
                        <span className="text-sm">💬</span>
                        WHATSAPP
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No leads found for this country
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
