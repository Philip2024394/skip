// [04] Admin - utils/whatsapp-trigger.ts

/**
 * Opens a direct WhatsApp chat with a pre-filled message.
 * @param prefix The country code (e.g., +27, +62)
 * @param phone The local number
 */
export const openWhatsAppChat = (prefix: string, phone: string) => {
  // Clean the numbers: remove spaces, dashes, or leading zeros
  const cleanPrefix = prefix.replace(/\D/g, '');
  const cleanPhone = phone.replace(/\D/g, '');
  
  const fullNumber = `${cleanPrefix}${cleanPhone}`;
  const message = encodeURIComponent("Hello! This is the Skip App Admin. How can we help you today?");
  
  // Official WhatsApp API Link
  const waUrl = `https://wa.me/${fullNumber}?text=${message}`;
  
  // Open in a new tab to keep the Admin Dashboard active
  window.open(waUrl, '_blank');
};

/**
 * Validates and formats a WhatsApp number for display
 * @param prefix The country code
 * @param phone The local number
 * @returns Formatted WhatsApp number
 */
export const formatWhatsAppNumber = (prefix: string, phone: string): string => {
  const cleanPrefix = prefix.replace(/\D/g, '');
  const cleanPhone = phone.replace(/\D/g, '');
  return `${cleanPrefix} ${cleanPhone}`;
};

/**
 * Gets the country flag emoji based on country prefix
 * @param prefix The country code
 * @returns Flag emoji
 */
export const getCountryFlag = (prefix: string): string => {
  const flags: Record<string, string> = {
    '+27': '🇿🇦',
    '+44': '🇬🇧',
    '+1': '🇺🇸',
    '+62': '🇮🇩',
    '+91': '🇮🇳',
    '+33': '🇫🇷',
    '+49': '🇩🇪',
    '+81': '🇯🇵',
    '+86': '🇨🇳',
    '+55': '🇧🇷',
  };
  return flags[prefix] || '🌍';
};
