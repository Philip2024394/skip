// Server-side validation for all user inputs
// Provides backend validation to prevent frontend bypasses

import { createClient } from '@supabase/supabase-js';

interface ValidationResult {
  isValid: boolean;
  violations: Array<{
    type: string;
    content: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  sanitizedContent?: string;
}

class ServerSideValidator {
  private static instance: ServerSideValidator;
  
  // Enhanced patterns for server-side validation
  private static readonly SECURITY_PATTERNS = {
    // URLs and links
    urls: [
      /https?:\/\/[^\s]+/gi,
      /www\.[^\s]+/gi,
      /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/gi,
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi
    ],
    
    // Phone numbers (enhanced)
    phones: [
      /\+?\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
      /\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
      /\d{7,15}/g,
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    ],
    
    // Platform references (expanded)
    platforms: [
      /\b(instagram|ig|facebook|fb|twitter|x|tiktok|snapchat|snap|linkedin|pinterest|reddit|discord|telegram|signal|whatsapp|wechat|viber|line|kakao|kik|skype|zoom|meet|teams|gmail|yahoo|hotmail|outlook|aol|icloud|protonmail|youtube|spotify|netflix|amazon|ebay|craigslist|gojek|grab|tokopedia|shopee|bukalapak|lazada|jd\.id|traveloka|tiket\.com|pegipegi|agoda|booking\.com)\b/gi,
      /\b(tinder|bumble|hinge|okcupid|match|pof|grindr|her|jswipe|jdate|christianmingle|eharmony|zoosk|plentyoffish)\b/gi
    ],
    
    // Code injection patterns
    codeInjection: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi
    ],
    
    // SQL injection patterns
    sqlInjection: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/gi,
      /(--|#|\/\*|\*\/)/gi,
      /(\b(UNION|ALL|SELECT|FROM|WHERE|GROUP|HAVING|ORDER|LIMIT)\b)/gi
    ]
  };

  // Number words mapping (enhanced)
  private static readonly NUMBER_WORDS: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
    'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
    'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
    'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000',
    'million': '1000000', 'billion': '1000000000'
  };

  public static getInstance(): ServerSideValidator {
    if (!ServerSideValidator.instance) {
      ServerSideValidator.instance = new ServerSideValidator();
    }
    return ServerSideValidator.instance;
  }

  // Main validation method
  public validateInput(input: string, context: string = 'general'): ValidationResult {
    const violations: any[] = [];
    let sanitizedContent = input;

    // Check for code injection
    this.checkCodeInjection(sanitizedContent, violations);
    
    // Check for SQL injection
    this.checkSqlInjection(sanitizedContent, violations);
    
    // Check for URLs and links
    this.checkUrls(sanitizedContent, violations);
    
    // Check for phone numbers
    this.checkPhoneNumbers(sanitizedContent, violations);
    
    // Check for disguised phone numbers
    this.checkDisguisedPhoneNumbers(sanitizedContent, violations);
    
    // Check for platform references
    this.checkPlatformReferences(sanitizedContent, violations);
    
    // Check for creative disguises
    this.checkCreativeDisguises(sanitizedContent, violations);

    // Sanitize content
    sanitizedContent = this.sanitizeContent(input);

    const isValid = violations.length === 0;

    return {
      isValid,
      violations,
      sanitizedContent: isValid ? input : sanitizedContent
    };
  }

  private checkCodeInjection(text: string, violations: any[]): void {
    for (const pattern of ServerSideValidator.SECURITY_PATTERNS.codeInjection) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'code_injection',
            content: match,
            severity: 'high' as const
          });
        });
      }
    }
  }

  private checkSqlInjection(text: string, violations: any[]): void {
    for (const pattern of ServerSideValidator.SECURITY_PATTERNS.sqlInjection) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'sql_injection',
            content: match,
            severity: 'high' as const
          });
        });
      }
    }
  }

  private checkUrls(text: string, violations: any[]): void {
    for (const pattern of ServerSideValidator.SECURITY_PATTERNS.urls) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'url',
            content: match,
            severity: 'medium' as const
          });
        });
      }
    }
  }

  private checkPhoneNumbers(text: string, violations: any[]): void {
    for (const pattern of ServerSideValidator.SECURITY_PATTERNS.phones) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!this.isYearOrOtherNumber(match)) {
            violations.push({
              type: 'phone_number',
              content: match,
              severity: 'medium' as const
            });
          }
        });
      }
    }
  }

  private checkDisguisedPhoneNumbers(text: string, violations: any[]): void {
    const words = text.toLowerCase().split(/\s+/);
    let numberSequence = '';
    let startIndex = -1;

    for (let i = 0; i < words.length; i++) {
      const word = words[i].trim();
      const number = ServerSideValidator.NUMBER_WORDS[word];
      
      if (number) {
        if (startIndex === -1) startIndex = i;
        numberSequence += number;
      } else if (numberSequence.length >= 7) {
        const originalText = words.slice(startIndex, i).join(' ');
        violations.push({
          type: 'disguised_phone',
          content: originalText,
          severity: 'medium' as const
        });
        numberSequence = '';
        startIndex = -1;
      } else {
        numberSequence = '';
        startIndex = -1;
      }
    }

    if (numberSequence.length >= 7) {
      const originalText = words.slice(startIndex).join(' ');
      violations.push({
        type: 'disguised_phone',
        content: originalText,
        severity: 'medium' as const
      });
    }
  }

  private checkPlatformReferences(text: string, violations: any[]): void {
    for (const pattern of ServerSideValidator.SECURITY_PATTERNS.platforms) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'platform_reference',
            content: match,
            severity: 'low' as const
          });
        });
      }
    }
  }

  private checkCreativeDisguises(text: string, violations: any[]): void {
    const disguisePatterns = [
      /(\d+)\s+(at|@)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /([a-zA-Z0-9.-]+)\s+(dot|\.|at)\s+(com|net|org|etc)/gi,
      /(contact|call|text|message|reach)\s+(me|at)\s+(\d+)/gi,
      /(whatsapp|wa|w\.a)\s+(me|at)\s+(\d+)/gi,
      /(find|search|look|add)\s+(me|for)\s+([a-zA-Z]+)/gi,
      /(\w+)\s+(dot|\.|at)\s+(\w+)/gi
    ];

    for (const pattern of disguisePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'creative_disguise',
            content: match,
            severity: 'high' as const
          });
        });
      }
    }
  }

  private isYearOrOtherNumber(text: string): boolean {
    if (/^(19|20)\d{2}$/.test(text)) return true;
    if (/^(100|200|300|400|500|600|700|800|900|1000)$/.test(text)) return true;
    if (text.length < 7) return true;
    return false;
  }

  // Content sanitization
  private sanitizeContent(input: string): string {
    return input
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove potentially dangerous characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Validate gift message
  public validateGiftMessage(message: string, userId: string): ValidationResult {
    const result = this.validateInput(message, 'gift_message');
    
    // Additional gift-specific validation
    if (message.length > 350) {
      result.violations.push({
        type: 'length_exceeded',
        content: message,
        severity: 'medium'
      });
      result.isValid = false;
    }

    // Log validation attempt
    this.logValidation(userId, message, result.violations, 'gift_message');
    
    return result;
  }

  // Validate user bio
  public validateUserBio(bio: string, userId: string): ValidationResult {
    const result = this.validateInput(bio, 'user_bio');
    
    // Additional bio-specific validation
    if (bio.length > 200) {
      result.violations.push({
        type: 'length_exceeded',
        content: bio,
        severity: 'medium'
      });
      result.isValid = false;
    }

    this.logValidation(userId, bio, result.violations, 'user_bio');
    
    return result;
  }

  // Validate chat message
  public validateChatMessage(message: string, userId: string): ValidationResult {
    const result = this.validateInput(message, 'chat_message');
    
    // Additional chat-specific validation
    if (message.length > 500) {
      result.violations.push({
        type: 'length_exceeded',
        content: message,
        severity: 'low'
      });
      result.isValid = false;
    }

    this.logValidation(userId, message, result.violations, 'chat_message');
    
    return result;
  }

  // Log validation attempts
  private async logValidation(userId: string, content: string, violations: any[], context: string): Promise<void> {
    if (violations.length > 0) {
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL || '',
          process.env.SUPABASE_ANON_KEY || ''
        );

        await supabase
          .from('security_violations')
          .insert({
            user_id: userId,
            original_text: content,
            violations: violations,
            context: context,
            timestamp: new Date().toISOString(),
            user_agent: 'server-side-validation',
            server_validation: true
          });
      } catch (error) {
        console.error('Server-side validation logging error:', error);
      }
    }
  }

  // Batch validation for multiple inputs
  public validateBatch(inputs: Array<{ content: string; context: string; userId: string }>): Array<ValidationResult> {
    return inputs.map(input => {
      switch (input.context) {
        case 'gift_message':
          return this.validateGiftMessage(input.content, input.userId);
        case 'user_bio':
          return this.validateUserBio(input.content, input.userId);
        case 'chat_message':
          return this.validateChatMessage(input.content, input.userId);
        default:
          return this.validateInput(input.content, input.context);
      }
    });
  }
}

// Export singleton instance
export default ServerSideValidator.getInstance();
