// Ultimate Security Filter for User-Generated Content
// Blocks links, phone numbers, disguised numbers, and platform references

interface SecurityViolation {
  type: 'link' | 'phone' | 'disguised_phone' | 'platform' | 'creative_disguise';
  content: string;
  position: number;
  severity: 'low' | 'medium' | 'high';
}

interface SecurityFilterResult {
  isAllowed: boolean;
  violations: SecurityViolation[];
  warningMessage?: string;
}

class SecurityFilter {
  private static instance: SecurityFilter;
  
  // Platform references to block
  private static readonly PLATFORM_REFERENCES = [
    // Social Media
    'instagram', 'ig', 'facebook', 'fb', 'twitter', 'x', 'tiktok', 'snapchat', 'snap',
    'linkedin', 'pinterest', 'reddit', 'discord', 'telegram', 'signal', 'whatsapp',
    'wechat', 'viber', 'line', 'kakao', 'kik', 'skype', 'zoom', 'meet', 'teams',
    
    // Dating Apps
    'tinder', 'bumble', 'hinge', 'okcupid', 'match', 'pof', 'grindr', 'her',
    'jswipe', 'jdate', 'christianmingle', 'eharmony', 'zoosk', 'plentyoffish',
    
    // General platforms
    'gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud', 'protonmail',
    'youtube', 'spotify', 'netflix', 'amazon', 'ebay', 'craigslist',
    
    // Indonesian specific
    'gojek', 'grab', 'tokopedia', 'shopee', 'bukalapak', 'lazada', 'jd.id',
    'traveloka', 'tiket.com', 'pegipegi', 'agoda', 'booking.com'
  ];

  // Number words mapping
  private static readonly NUMBER_WORDS: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
    'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
    'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
    'eighty': '80', 'ninety': '90', 'hundred': '100'
  };

  // Domain suffixes
  private static readonly DOMAIN_SUFFIXES = [
    '.com', '.net', '.org', '.edu', '.gov', '.mil', '.int', '.info', '.biz',
    '.co', '.io', '.ai', '.tech', '.app', '.dev', '.xyz', '.me', '.us', '.uk',
    '.ca', '.au', '.de', '.fr', '.jp', '.cn', '.in', '.br', '.mx', '.es',
    '.it', '.ru', '.kr', '.nl', '.se', '.no', '.fi', '.dk', '.ch', '.at',
    '.id', '.my', '.sg', '.ph', '.th', '.vn', '.hk', '.tw', '.nz'
  ];

  public static getInstance(): SecurityFilter {
    if (!SecurityFilter.instance) {
      SecurityFilter.instance = new SecurityFilter();
    }
    return SecurityFilter.instance;
  }

  // Main filter method
  public filterText(text: string, context: string = 'general'): SecurityFilterResult {
    const violations: SecurityViolation[] = [];
    const lowerText = text.toLowerCase();

    // Check for links
    this.checkLinks(text, violations);
    
    // Check for phone numbers
    this.checkPhoneNumbers(text, violations);
    
    // Check for disguised phone numbers
    this.checkDisguisedPhoneNumbers(lowerText, violations);
    
    // Check for platform references
    this.checkPlatformReferences(lowerText, violations);
    
    // Check for creative disguises (NLP layer)
    this.checkCreativeDisguises(lowerText, violations);

    const isAllowed = violations.length === 0;
    const warningMessage = isAllowed ? undefined : this.generateWarningMessage(violations);

    return {
      isAllowed,
      violations,
      warningMessage
    };
  }

  private checkLinks(text: string, violations: SecurityViolation[]): void {
    // URL patterns
    const urlPatterns = [
      /https?:\/\/[^\s]+/gi,
      /www\.[^\s]+/gi,
      /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/gi
    ];

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'link',
            content: match,
            position: text.indexOf(match),
            severity: 'high'
          });
        });
      }
    }

    // Check for domain suffixes
    for (const suffix of SecurityFilter.DOMAIN_SUFFIXES) {
      if (text.toLowerCase().includes(suffix)) {
        const words = text.toLowerCase().split(/\s+/);
        words.forEach((word, index) => {
          if (word.includes(suffix)) {
            violations.push({
              type: 'link',
              content: word,
              position: text.toLowerCase().indexOf(word),
              severity: 'high'
            });
          }
        });
      }
    }
  }

  private checkPhoneNumbers(text: string, violations: SecurityViolation[]): void {
    // Phone number patterns (7+ digits)
    const phonePatterns = [
      // International format: +62 812-3456-7890
      /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
      // Standard format: (0812) 345-6789
      /\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
      // Simple format: 08123456789
      /\d{7,15}/g
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Exclude years (1900-2099) and other non-phone numbers
          if (!this.isYearOrOtherNumber(match)) {
            violations.push({
              type: 'phone',
              content: match,
              position: text.indexOf(match),
              severity: 'high'
            });
          }
        });
      }
    }
  }

  private checkDisguisedPhoneNumbers(text: string, violations: SecurityViolation[]): void {
    // Check for number words that form phone numbers
    const words = text.split(/\s+/);
    let numberSequence = '';
    let startIndex = -1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().trim();
      const number = SecurityFilter.NUMBER_WORDS[word];
      
      if (number) {
        if (startIndex === -1) startIndex = i;
        numberSequence += number;
      } else if (numberSequence.length >= 7) {
        // Found a disguised phone number
        const originalText = words.slice(startIndex, i).join(' ');
        violations.push({
          type: 'disguised_phone',
          content: originalText,
          position: text.toLowerCase().indexOf(originalText),
          severity: 'medium'
        });
        numberSequence = '';
        startIndex = -1;
      } else {
        numberSequence = '';
        startIndex = -1;
      }
    }

    // Check at the end of text
    if (numberSequence.length >= 7) {
      const originalText = words.slice(startIndex).join(' ');
      violations.push({
        type: 'disguised_phone',
        content: originalText,
        position: text.toLowerCase().indexOf(originalText),
        severity: 'medium'
      });
    }
  }

  private checkPlatformReferences(text: string, violations: SecurityViolation[]): void {
    for (const platform of SecurityFilter.PLATFORM_REFERENCES) {
      const regex = new RegExp(`\\b${platform}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'platform',
            content: match,
            position: text.toLowerCase().indexOf(match.toLowerCase()),
            severity: 'medium'
          });
        });
      }
    }
  }

  private checkCreativeDisguises(text: string, violations: SecurityViolation[]): void {
    // Creative disguise patterns
    const disguisePatterns = [
      // "number at domain" patterns
      /(\d+)\s+(at|@)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      // "domain dot com" patterns
      /([a-zA-Z0-9.-]+)\s+(dot|\.|at)\s+(com|net|org|etc)/gi,
      // "contact me on" patterns
      /(contact|call|text|message|reach)\s+(me|at)\s+(\d+)/gi,
      // "WhatsApp me at" patterns
      /(whatsapp|wa|w\.a)\s+(me|at)\s+(\d+)/gi,
      // "find me on" patterns
      /(find|search|look|add)\s+(me|for)\s+([a-zA-Z]+)/gi
    ];

    for (const pattern of disguisePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'creative_disguise',
            content: match,
            position: text.toLowerCase().indexOf(match.toLowerCase()),
            severity: 'high'
          });
        });
      }
    }
  }

  private isYearOrOtherNumber(text: string): boolean {
    // Check if it's a year (1900-2099)
    if (/^(19|20)\d{2}$/.test(text)) return true;
    
    // Check if it's a common non-phone number
    if (/^(100|200|300|400|500|600|700|800|900|1000)$/.test(text)) return true;
    
    // Check if it's too short to be a phone number
    if (text.length < 7) return true;
    
    return false;
  }

  private generateWarningMessage(violations: SecurityViolation[]): string {
    const types = [...new Set(violations.map(v => v.type))];
    
    if (types.includes('link') || types.includes('creative_disguise')) {
      return "Sharing links, websites, or external platform references is strictly prohibited. Please use the app's features to connect safely.";
    }
    
    if (types.includes('phone') || types.includes('disguised_phone')) {
      return "Sharing phone numbers is strictly prohibited. Please use the app's built-in messaging to connect safely.";
    }
    
    if (types.includes('platform')) {
      return "Mentioning external platforms is strictly prohibited. Please keep all communication within the app.";
    }
    
    return "Sharing phone numbers, links, or external platform references is strictly prohibited. Please use the app's features to connect safely.";
  }

  // Method to log violations for admin monitoring
  public async logViolation(
    userId: string, 
    text: string, 
    violations: SecurityViolation[], 
    context: string
  ): Promise<void> {
    if (import.meta.env.PROD && violations.length > 0) {
      try {
        const { error } = await supabase
          .from('security_violations')
          .insert({
            user_id: userId,
            original_text: text,
            violations: violations,
            context: context,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          });
        
        if (error) {
          console.error('Security violation logging error:', error);
        }
      } catch (error) {
        console.error('Security violation logging failed:', error);
      }
    }
  }

  // Method to get security statistics for admin dashboard
  public async getSecurityStats(timeframe: string = '24h'): Promise<any> {
    if (import.meta.env.PROD) {
      try {
        const timeFilter = timeframe === '24h' ? 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() :
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('security_violations')
          .select('*')
          .gte('timestamp', timeFilter);

        if (error) throw error;

        return {
          total: data.length,
          byType: this.groupByType(data),
          byContext: this.groupByContext(data),
          topUsers: this.getTopUsers(data)
        };
      } catch (error) {
        console.error('Security stats error:', error);
        return null;
      }
    }
    return null;
  }

  private groupByType(data: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      item.violations.forEach((v: SecurityViolation) => {
        grouped[v.type] = (grouped[v.type] || 0) + 1;
      });
    });
    return grouped;
  }

  private groupByContext(data: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      grouped[item.context] = (grouped[item.context] || 0) + 1;
    });
    return grouped;
  }

  private getTopUsers(data: any[]): Array<{userId: string, count: number}> {
    const userCounts: Record<string, number> = {};
    data.forEach(item => {
      userCounts[item.user_id] = (userCounts[item.user_id] || 0) + 1;
    });
    
    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Export singleton instance
export default SecurityFilter.getInstance();
