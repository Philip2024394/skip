// Rate limiting and bot protection system
// Prevents automated attacks and spam

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  reasons: string[];
  score: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, Array<{ timestamp: number; success: boolean }>> = new Map();
  private botScores: Map<string, number> = new Map();
  private ipRequests: Map<string, Array<{ timestamp: number; userAgent: string }>> = new Map();

  // Rate limit configurations for different actions
  private static readonly RATE_LIMITS: Record<string, RateLimitConfig> = {
    // General API requests
    'api': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100
    },
    
    // Gift sending
    'gift_send': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10
    },
    
    // Message sending
    'message_send': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20
    },
    
    // Auth attempts
    'auth': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    },
    
    // Profile updates
    'profile_update': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3
    },
    
    // Token purchases
    'token_purchase': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 2
    }
  };

  // Bot detection patterns
  private static readonly BOT_PATTERNS = {
    // Suspicious user agents
    userAgents: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /node/i,
      /php/i,
      /ruby/i,
      /go-http/i,
      /postman/i,
      /insomnia/i
    ],
    
    // Rapid request patterns
    rapidRequests: {
      threshold: 10, // requests
      windowMs: 1000, // 1 second
      score: 30
    },
    
    // Consistent timing patterns (bot-like)
    consistentTiming: {
      varianceThreshold: 100, // milliseconds
      minRequests: 5,
      score: 20
    },
    
    // Missing headers
    missingHeaders: [
      'user-agent',
      'accept',
      'accept-language'
    ],
    
    // Suspicious IP patterns
    suspiciousIPs: [
      /10\./, // Private networks
      /192\.168\./, // Private networks
      /172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private networks
      /^127\./, // Localhost
    ]
  };

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  // Check rate limit for a specific action
  public checkRateLimit(identifier: string, action: string): RateLimitResult {
    const config = RateLimiter.RATE_LIMITS[action] || RateLimiter.RATE_LIMITS['api'];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Filter requests within the time window
    userRequests = userRequests.filter(req => req.timestamp > windowStart);
    
    // Count requests based on configuration
    let requestCount = userRequests.length;
    
    if (config.skipSuccessfulRequests) {
      requestCount = userRequests.filter(req => !req.success).length;
    }
    
    if (config.skipFailedRequests) {
      requestCount = userRequests.filter(req => req.success).length;
    }

    const allowed = requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const resetTime = new Date(now + config.windowMs);

    // Store current request
    if (allowed) {
      userRequests.push({ timestamp: now, success: true });
    } else {
      userRequests.push({ timestamp: now, success: false });
    }

    this.requests.set(identifier, userRequests);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000)
    };
  }

  // Bot detection
  public detectBot(request: {
    userAgent?: string;
    ip?: string;
    headers?: Record<string, string>;
    userId?: string;
  }): BotDetectionResult {
    const reasons: string[] = [];
    let score = 0;

    // Check user agent
    if (request.userAgent) {
      for (const pattern of RateLimiter.BOT_PATTERNS.userAgents) {
        if (pattern.test(request.userAgent)) {
          reasons.push(`Suspicious user agent: ${request.userAgent}`);
          score += 25;
        }
      }

      // Check for missing common headers
      const missingHeaders = RateLimiter.BOT_PATTERNS.missingHeaders.filter(
        header => !request.headers || !request.headers[header]
      );
      
      if (missingHeaders.length > 0) {
        reasons.push(`Missing headers: ${missingHeaders.join(', ')}`);
        score += 15;
      }
    }

    // Check IP address
    if (request.ip) {
      for (const pattern of RateLimiter.BOT_PATTERNS.suspiciousIPs) {
        if (pattern.test(request.ip)) {
          reasons.push(`Suspicious IP: ${request.ip}`);
          score += 20;
        }
      }
    }

    // Check rapid requests
    if (request.userId) {
      const userRequests = this.requests.get(request.userId) || [];
      const now = Date.now();
      const recentRequests = userRequests.filter(req => 
        now - req.timestamp < RateLimiter.BOT_PATTERNS.rapidRequests.windowMs
      );

      if (recentRequests.length >= RateLimiter.BOT_PATTERNS.rapidRequests.threshold) {
        reasons.push(`Rapid requests: ${recentRequests.length} in 1 second`);
        score += RateLimiter.BOT_PATTERNS.rapidRequests.score;
      }

      // Check consistent timing
      if (recentRequests.length >= RateLimiter.BOT_PATTERNS.consistentTiming.minRequests) {
        const intervals: number[] = [];
        for (let i = 1; i < recentRequests.length; i++) {
          intervals.push(recentRequests[i].timestamp - recentRequests[i-1].timestamp);
        }

        const variance = this.calculateVariance(intervals);
        if (variance < RateLimiter.BOT_PATTERNS.consistentTiming.varianceThreshold) {
          reasons.push(`Consistent request timing: variance ${variance}ms`);
          score += RateLimiter.BOT_PATTERNS.consistentTiming.score;
        }
      }
    }

    // Update bot score
    if (request.userId) {
      const currentScore = this.botScores.get(request.userId) || 0;
      const newScore = Math.max(0, currentScore * 0.9 + score * 0.1); // Exponential moving average
      this.botScores.set(request.userId, newScore);
      score = newScore;
    }

    const confidence = Math.min(100, score);
    const isBot = confidence > 50; // 50% threshold

    return {
      isBot,
      confidence,
      reasons,
      score
    };
  }

  // Calculate variance of timing intervals
  private calculateVariance(intervals: number[]): number {
    if (intervals.length === 0) return 0;
    
    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const squaredDiffs = intervals.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / intervals.length;
    
    return Math.sqrt(variance);
  }

  // Behavioral analysis
  public analyzeBehavior(userId: string, actions: Array<{
    type: string;
    timestamp: number;
    metadata?: any;
  }>): {
    isSuspicious: boolean;
    score: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 0;

    // Analyze action patterns
    const actionTypes = actions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for repetitive actions
    Object.entries(actionTypes).forEach(([type, count]) => {
      if (count > 10) {
        reasons.push(`High frequency of ${type}: ${count} times`);
        score += 15;
      }
    });

    // Check for unusual timing patterns
    const timestamps = actions.map(a => a.timestamp).sort((a, b) => a - b);
    const intervals: number[] = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      
      // Very fast actions (less than 100ms average)
      if (avgInterval < 100) {
        reasons.push(`Very fast actions: ${avgInterval.toFixed(0)}ms average`);
        score += 20;
      }

      // Too consistent timing
      const variance = this.calculateVariance(intervals);
      if (variance < 50) {
        reasons.push(`Too consistent timing: ${variance.toFixed(0)}ms variance`);
        score += 15;
      }
    }

    // Check for script-like patterns
    const giftActions = actions.filter(a => a.type === 'gift_send');
    if (giftActions.length > 5) {
      const giftIntervals: number[] = [];
      for (let i = 1; i < giftActions.length; i++) {
        giftIntervals.push(giftActions[i].timestamp - giftActions[i-1].timestamp);
      }

      if (giftIntervals.length > 0) {
        const avgGiftInterval = giftIntervals.reduce((sum, val) => sum + val, 0) / giftIntervals.length;
        
        // Sending gifts every 2 seconds exactly
        if (avgGiftInterval > 1900 && avgGiftInterval < 2100) {
          reasons.push(`Script-like gift sending: ${avgGiftInterval.toFixed(0)}ms average`);
          score += 30;
        }
      }
    }

    const isSuspicious = score > 40; // 40 point threshold

    return {
      isSuspicious,
      score,
      reasons
    };
  }

  // CAPTCHA requirement check
  public requiresCaptcha(userId: string, action: string): boolean {
    // Check if user has high bot score
    const botScore = this.botScores.get(userId) || 0;
    if (botScore > 60) return true;

    // Check if user has recent violations
    const userRequests = this.requests.get(userId) || [];
    const recentFailures = userRequests.filter(req => 
      !req.success && Date.now() - req.timestamp < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    return recentFailures > 3;
  }

  // Clean up old data
  public cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old requests
    for (const [key, requests] of this.requests.entries()) {
      const filtered = requests.filter(req => now - req.timestamp < maxAge);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }

    // Clean up old bot scores
    for (const [key, score] of this.botScores.entries()) {
      // Decay scores over time
      const decayedScore = score * 0.95;
      if (decayedScore < 1) {
        this.botScores.delete(key);
      } else {
        this.botScores.set(key, decayedScore);
      }
    }
  }

  // Get statistics
  public getStats(): {
    totalUsers: number;
    totalRequests: number;
    averageBotScore: number;
    highRiskUsers: number;
  } {
    const totalUsers = this.requests.size;
    const totalRequests = Array.from(this.requests.values())
      .reduce((sum, requests) => sum + requests.length, 0);
    
    const botScores = Array.from(this.botScores.values());
    const averageBotScore = botScores.length > 0 ? 
      botScores.reduce((sum, score) => sum + score, 0) / botScores.length : 0;
    
    const highRiskUsers = botScores.filter(score => score > 60).length;

    return {
      totalUsers,
      totalRequests,
      averageBotScore,
      highRiskUsers
    };
  }
}

// Export singleton instance
export default RateLimiter.getInstance();
