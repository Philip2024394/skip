// Security middleware for CSP, XSS protection, and malware defense
// Provides comprehensive security headers and content validation

interface SecurityConfig {
  contentSecurityPolicy: string;
  allowedDomains: string[];
  maxFileSize: number;
  allowedFileTypes: string[];
  enableXSSProtection: boolean;
  enableHSTS: boolean;
  enableFrameProtection: boolean;
}

interface FileValidationResult {
  isValid: boolean;
  allowed: boolean;
  threats: string[];
  sanitized?: boolean;
  metadata?: {
    size: number;
    type: string;
    name: string;
  };
}

class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  
  private static readonly SECURITY_CONFIG: SecurityConfig = {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://imagekit.io",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    allowedDomains: [
      'localhost',
      '2dateme.com',
      'supabase.co',
      'stripe.com',
      'js.stripe.com',
      'imagekit.io',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'apis.google.com'
    ],
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/ogg'
    ],
    enableXSSProtection: true,
    enableHSTS: true,
    enableFrameProtection: true
  };

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  // Get security headers
  public getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    headers['Content-Security-Policy'] = SecurityMiddleware.SECURITY_CONFIG.contentSecurityPolicy;

    // XSS Protection
    if (SecurityMiddleware.SECURITY_CONFIG.enableXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    // HSTS (HTTPS Strict Transport Security)
    if (SecurityMiddleware.SECURITY_CONFIG.enableHSTS && process.env.NODE_ENV === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // Frame protection
    if (SecurityMiddleware.SECURITY_CONFIG.enableFrameProtection) {
      headers['X-Frame-Options'] = 'DENY';
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
      headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), payment=()';
    }

    // Additional security headers
    headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    headers['Cross-Origin-Resource-Policy'] = 'same-origin';
    headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    headers['DNS-Prefetch-Control'] = 'off';

    return headers;
  }

  // Validate and sanitize HTML content
  public sanitizeHTML(input: string): string {
    // Remove potentially dangerous HTML tags and attributes
    const dangerousTags = [
      'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea',
      'button', 'select', 'option', 'link', 'meta', 'style', 'applet'
    ];

    const dangerousAttributes = [
      'onload', 'onunload', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
      'onmouseover', 'onmousemove', 'onmouseout', 'onfocus', 'onblur',
      'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit', 'onreset', 'onchange',
      'onselect', 'onerror', 'onabort', 'onresize', 'onscroll'
    ];

    let sanitized = input;

    // Remove dangerous tags
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
      sanitized = sanitized.replace(regex, '');
      
      // Also remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}[^>]*\/>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, '');
    });

    // Remove dangerous attributes
    dangerousAttributes.forEach(attr => {
      const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Remove JavaScript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: URLs (except for images)
    sanitized = sanitized.replace(/data:(?!image\/)/gi, '');

    // Remove vbscript: protocol
    sanitized = sanitized.replace(/vbscript:/gi, '');

    // Remove file: protocol
    sanitized = sanitized.replace(/file:/gi, '');

    // Remove @import (CSS injection)
    sanitized = sanitized.replace(/@import[^;]*;/gi, '');

    // Remove expression() (CSS)
    sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');

    return sanitized.trim();
  }

  // Validate file uploads
  public validateFile(file: File): FileValidationResult {
    const threats: string[] = [];
    const result: FileValidationResult = {
      isValid: true,
      allowed: true,
      threats: [],
      metadata: {
        size: file.size,
        type: file.type,
        name: file.name
      }
    };

    // Check file size
    if (file.size > SecurityMiddleware.SECURITY_CONFIG.maxFileSize) {
      threats.push(`File size ${file.size} exceeds maximum ${SecurityMiddleware.SECURITY_CONFIG.maxFileSize}`);
      result.isValid = false;
      result.allowed = false;
    }

    // Check file type
    if (!SecurityMiddleware.SECURITY_CONFIG.allowedFileTypes.includes(file.type)) {
      threats.push(`File type ${file.type} not allowed`);
      result.isValid = false;
      result.allowed = false;
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.rb$/i,
      /\.py$/i,
      /\.pl$/i,
      /\.sh$/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        threats.push(`Suspicious file extension: ${file.name}`);
        result.isValid = false;
        result.allowed = false;
        break;
      }
    }

    // Check for double extensions
    if (/(.*)\.(.*)\.(.*)/.test(file.name)) {
      threats.push(`Double extension detected: ${file.name}`);
      result.isValid = false;
      result.allowed = false;
    }

    // Check for script content in file name
    if (/script|javascript|vbscript|onload|onerror/i.test(file.name)) {
      threats.push(`Suspicious content in filename: ${file.name}`);
      result.isValid = false;
      result.allowed = false;
    }

    result.threats = threats;

    return result;
  }

  // Scan file content for malware patterns
  public async scanFileContent(file: File): Promise<{
    isClean: boolean;
    threats: string[];
    confidence: number;
  }> {
    const threats: string[] = [];
    let confidence = 100;

    try {
      // Read file content as text
      const content = await this.readFileAsText(file);
      
      // Check for malware signatures
      const malwareSignatures = [
        /eval\s*\(/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /shell_exec\s*\(/gi,
        /passthru\s*\(/gi,
        /base64_decode\s*\(/gi,
        /file_get_contents\s*\(/gi,
        /fopen\s*\(/gi,
        /fwrite\s*\(/gi,
        /curl_exec\s*\(/gi,
        /document\.write\s*\(/gi,
        /innerHTML\s*=/gi,
        /outerHTML\s*=/gi,
        /createObjectURL\s*\(/gi,
        /blob\s*:/gi,
        /atob\s*\(/gi,
        /btoa\s*\(/gi
      ];

      for (const signature of malwareSignatures) {
        if (signature.test(content)) {
          threats.push(`Malware signature detected: ${signature.source}`);
          confidence -= 10;
        }
      }

      // Check for suspicious URLs
      const suspiciousUrls = [
        /http[s]?:\/\/[^\s]*\.exe/gi,
        /http[s]?:\/\/[^\s]*\.bat/gi,
        /http[s]?:\/\/[^\s]*\.scr/gi,
        /http[s]?:\/\/[^\s]*download/gi,
        /http[s]?:\/\/[^\s]*malware/gi,
        /http[s]?:\/\/[^\s]*virus/gi
      ];

      for (const urlPattern of suspiciousUrls) {
        if (urlPattern.test(content)) {
          threats.push(`Suspicious URL detected: ${urlPattern.source}`);
          confidence -= 15;
        }
      }

      // Check for encoded content
      if (/%[0-9A-Fa-f]{2}/.test(content)) {
        threats.push('URL-encoded content detected');
        confidence -= 5;
      }

      // Check for obfuscated code
      if (/(\\x[0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4})/.test(content)) {
        threats.push('Obfuscated code detected');
        confidence -= 10;
      }

    } catch (error) {
      threats.push('Error reading file content');
      confidence = 0;
    }

    return {
      isClean: confidence > 70,
      threats,
      confidence: Math.max(0, confidence)
    };
  }

  // Helper method to read file as text
  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Validate API requests
  public validateApiRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    userId?: string;
  }): {
    isValid: boolean;
    threats: string[];
    sanitizedBody?: any;
  } {
    const threats: string[] = [];
    let isValid = true;

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-cluster-client-ip'
    ];

    for (const header of suspiciousHeaders) {
      if (request.headers[header]) {
        const value = request.headers[header];
        
        // Check for private IP ranges
        if (/(10\.|192\.168\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|127\.)/.test(value)) {
          threats.push(`Suspicious IP in header ${header}: ${value}`);
          isValid = false;
        }
      }
    }

    // Check request body for injection attempts
    if (request.body) {
      const bodyString = typeof request.body === 'string' ? 
        request.body : JSON.stringify(request.body);

      // Check for SQL injection
      const sqlPatterns = [
        /union\s+select/gi,
        /drop\s+table/gi,
        /insert\s+into/gi,
        /delete\s+from/gi,
        /update\s+set/gi,
        /exec\s*\(/gi,
        /script\s*>/gi,
        /<script/gi,
        /javascript:/gi
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(bodyString)) {
          threats.push(`SQL injection attempt: ${pattern.source}`);
          isValid = false;
        }
      }

      // Check for XSS attempts
      const xssPatterns = [
        /<script[^>]*>/gi,
        /on\w+\s*=/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /data:text\/html/gi
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(bodyString)) {
          threats.push(`XSS attempt: ${pattern.source}`);
          isValid = false;
        }
      }
    }

    // Check for suspicious user agents
    const userAgent = request.headers['user-agent'] || '';
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /node/i
    ];

    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        threats.push(`Suspicious user agent: ${userAgent}`);
        // Don't block, just log
        break;
      }
    }

    return {
      isValid,
      threats,
      sanitizedBody: request.body
    };
  }

  // Generate nonce for CSP
  public generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Update CSP with nonce
  public getCSPWithNonce(nonce: string): string {
    const csp = SecurityMiddleware.SECURITY_CONFIG.contentSecurityPolicy;
    return csp.replace("'unsafe-inline'", `'nonce-${nonce}'`);
  }

  // Validate external URLs
  public validateExternalUrl(url: string): {
    isValid: boolean;
    allowed: boolean;
    threats: string[];
  } {
    const threats: string[] = [];
    let isValid = true;
    let allowed = true;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check if domain is in allowlist
      if (!SecurityMiddleware.SECURITY_CONFIG.allowedDomains.some(allowed => 
        domain === allowed || domain.endsWith(`.${allowed}`)
      )) {
        threats.push(`Domain not allowed: ${domain}`);
        allowed = false;
      }

      // Check for suspicious protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        threats.push(`Suspicious protocol: ${urlObj.protocol}`);
        isValid = false;
        allowed = false;
      }

      // Check for suspicious ports
      if (urlObj.port && !['80', '443'].includes(urlObj.port)) {
        threats.push(`Suspicious port: ${urlObj.port}`);
        isValid = false;
      }

      // Check for suspicious paths
      const suspiciousPaths = [
        /admin/i,
        /login/i,
        /upload/i,
        /download/i,
        /exec/i,
        /cmd/i,
        /shell/i
      ];

      for (const pattern of suspiciousPaths) {
        if (pattern.test(urlObj.pathname)) {
          threats.push(`Suspicious path: ${urlObj.pathname}`);
          isValid = false;
        }
      }

    } catch (error) {
      threats.push(`Invalid URL: ${url}`);
      isValid = false;
      allowed = false;
    }

    return {
      isValid,
      allowed,
      threats
    };
  }

  // Get security configuration
  public getConfig(): SecurityConfig {
    return { ...SecurityMiddleware.SECURITY_CONFIG };
  }
}

// Export singleton instance
export default SecurityMiddleware.getInstance();
