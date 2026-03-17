// Lightweight logging system for production monitoring
// Tracks gift interactions and live calls for edge case detection

interface GiftInteractionLog {
  id: string;
  type: 'gift_sent' | 'gift_received' | 'gift_accepted' | 'gift_refused' | 'gift_purchase';
  userId: string;
  giftId?: string;
  giftName?: string;
  recipientId?: string;
  tokenAmount?: number;
  isFreeGift?: boolean;
  timestamp: string;
  userAgent: string;
  sessionId: string;
  error?: string;
}

interface CallInteractionLog {
  id: string;
  type: 'call_started' | 'call_ended' | 'call_failed' | 'call_extended';
  userId: string;
  matchId: string;
  callId: string;
  duration?: number;
  timestamp: string;
  userAgent: string;
  sessionId: string;
  error?: string;
}

class AnalyticsLogger {
  private sessionId: string;
  private isProduction: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = import.meta.env.PROD;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logToSupabase(table: string, data: any): Promise<void> {
    if (!this.isProduction) return; // Only log in production

    try {
      const { error } = await supabase
        .from(table)
        .insert(data);

      if (error) {
        console.error('Analytics logging error:', error);
        // Fallback to console for critical errors
        console.warn('Analytics fallback:', data);
      }
    } catch (error) {
      console.error('Analytics logging failed:', error);
    }
  }

  // Gift interaction logging
  logGiftSent(data: {
    userId: string;
    giftId: string;
    giftName: string;
    recipientId: string;
    tokenAmount: number;
    isFreeGift: boolean;
    error?: string;
  }): void {
    const logEntry: GiftInteractionLog = {
      id: `gift_sent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'gift_sent',
      userId: data.userId,
      giftId: data.giftId,
      giftName: data.giftName,
      recipientId: data.recipientId,
      tokenAmount: data.tokenAmount,
      isFreeGift: data.isFreeGift,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      error: data.error
    };

    this.logToSupabase('gift_interaction_logs', logEntry);
  }

  logGiftReceived(data: {
    userId: string;
    giftId: string;
    giftName: string;
    senderId: string;
  }): void {
    const logEntry: GiftInteractionLog = {
      id: `gift_received_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'gift_received',
      userId: data.userId,
      giftId: data.giftId,
      giftName: data.giftName,
      recipientId: data.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.logToSupabase('gift_interaction_logs', logEntry);
  }

  logGiftAccepted(data: {
    userId: string;
    giftId: string;
    senderId: string;
  }): void {
    const logEntry: GiftInteractionLog = {
      id: `gift_accepted_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'gift_accepted',
      userId: data.userId,
      giftId: data.giftId,
      recipientId: data.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.logToSupabase('gift_interaction_logs', logEntry);
  }

  logGiftRefused(data: {
    userId: string;
    giftId: string;
    senderId: string;
  }): void {
    const logEntry: GiftInteractionLog = {
      id: `gift_refused_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'gift_refused',
      userId: data.userId,
      giftId: data.giftId,
      recipientId: data.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.logToSupabase('gift_interaction_logs', logEntry);
  }

  logGiftPurchase(data: {
    userId: string;
    tokenAmount: number;
    price: number;
    error?: string;
  }): void {
    const logEntry: GiftInteractionLog = {
      id: `gift_purchase_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'gift_purchase',
      userId: data.userId,
      tokenAmount: data.tokenAmount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      error: data.error
    };

    this.logToSupabase('gift_interaction_logs', logEntry);
  }

  // Call interaction logging
  logCallStarted(data: {
    userId: string;
    matchId: string;
    callId: string;
  }): void {
    const logEntry: CallInteractionLog = {
      id: `call_started_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'call_started',
      userId: data.userId,
      matchId: data.matchId,
      callId: data.callId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.logToSupabase('call_interaction_logs', logEntry);
  }

  logCallEnded(data: {
    userId: string;
    matchId: string;
    callId: string;
    duration: number;
  }): void {
    const logEntry: CallInteractionLog = {
      id: `call_ended_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'call_ended',
      userId: data.userId,
      matchId: data.matchId,
      callId: data.callId,
      duration: data.duration,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.logToSupabase('call_interaction_logs', logEntry);
  }

  logCallFailed(data: {
    userId: string;
    matchId: string;
    callId: string;
    error: string;
  }): void {
    const logEntry: CallInteractionLog = {
      id: `call_failed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'call_failed',
      userId: data.userId,
      matchId: data.matchId,
      callId: data.callId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      error: data.error
    };

    this.logToSupabase('call_interaction_logs', logEntry);
  }

  logCallExtended(data: {
    userId: string;
    matchId: string;
    callId: string;
  }): void {
    const logEntry: CallInteractionLog = {
      id: `call_extended_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'call_extended',
      userId: data.userId,
      matchId: data.matchId,
      callId: data.callId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.logToSupabase('call_interaction_logs', logEntry);
  }

  // Utility method to get session info
  getSessionInfo(): { sessionId: string; isProduction: boolean } {
    return {
      sessionId: this.sessionId,
      isProduction: this.isProduction
    };
  }
}

// Singleton instance
const analyticsLogger = new AnalyticsLogger();

export default analyticsLogger;
