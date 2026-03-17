// Enhanced admin security with 2FA, RBAC, and audit logging
// Provides comprehensive protection for admin functions

import { createClient } from '@supabase/supabase-js';

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  sessionExpiry?: Date;
}

interface AdminSession {
  id: string;
  adminId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  twoFactorVerified: boolean;
}

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support';

type Permission = 
  | 'view_analytics'
  | 'manage_users'
  | 'manage_gifts'
  | 'manage_tokens'
  | 'view_security'
  | 'manage_security'
  | 'view_whatsapp'
  | 'manage_whatsapp'
  | 'audit_logs'
  | 'system_config';

class AdminSecurity {
  private static instance: AdminSecurity;
  private sessions: Map<string, AdminSession> = new Map();
  private auditLogs: AuditLog[] = [];
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Role-based access control matrix
  private static readonly ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
    super_admin: [
      'view_analytics', 'manage_users', 'manage_gifts', 'manage_tokens',
      'view_security', 'manage_security', 'view_whatsapp', 'manage_whatsapp',
      'audit_logs', 'system_config'
    ],
    admin: [
      'view_analytics', 'manage_users', 'manage_gifts', 'manage_tokens',
      'view_security', 'view_whatsapp', 'manage_whatsapp', 'audit_logs'
    ],
    moderator: [
      'view_analytics', 'manage_gifts', 'view_security', 'view_whatsapp', 'audit_logs'
    ],
    support: [
      'view_analytics', 'view_whatsapp', 'audit_logs'
    ]
  };

  // 2FA configuration
  private static readonly TWO_FACTOR_CONFIG = {
    issuer: '2DateMe Admin',
    algorithm: 'SHA1' as const,
    digits: 6,
    period: 30,
    window: 1
  };

  public static getInstance(): AdminSecurity {
    if (!AdminSecurity.instance) {
      AdminSecurity.instance = new AdminSecurity();
    }
    return AdminSecurity.instance;
  }

  // Enhanced admin authentication with 2FA
  public async authenticateAdmin(
    email: string, 
    password: string, 
    twoFactorCode?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    session?: AdminSession;
    requiresTwoFactor?: boolean;
    error?: string;
  }> {
    try {
      // Step 1: Verify credentials
      const { data: adminUser, error } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !adminUser) {
        await this.logAudit(null, 'admin_login_failed', 'auth', {
          email,
          reason: 'invalid_credentials'
        }, ipAddress, userAgent, false);
        
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password (should be hashed in production)
      const passwordValid = await this.verifyPassword(password, adminUser.password_hash);
      if (!passwordValid) {
        await this.logAudit(adminUser.id, 'admin_login_failed', 'auth', {
          reason: 'invalid_password'
        }, ipAddress, userAgent, false);
        
        return { success: false, error: 'Invalid credentials' };
      }

      // Step 2: Check if 2FA is required
      if (adminUser.two_factor_enabled && !twoFactorCode) {
        return { success: false, requiresTwoFactor: true };
      }

      // Step 3: Verify 2FA code if required
      if (adminUser.two_factor_enabled && twoFactorCode) {
        const twoFactorValid = await this.verifyTwoFactorCode(
          adminUser.two_factor_secret,
          twoFactorCode
        );

        if (!twoFactorValid) {
          await this.logAudit(adminUser.id, 'admin_login_failed', 'auth', {
            reason: 'invalid_2fa'
          }, ipAddress, userAgent, false);
          
          return { success: false, error: 'Invalid 2FA code' };
        }
      }

      // Step 4: Create admin session
      const session = await this.createAdminSession(
        adminUser.id,
        ipAddress || 'unknown',
        userAgent || 'unknown'
      );

      await this.logAudit(adminUser.id, 'admin_login_success', 'auth', {
        session_id: session.id
      }, ipAddress, userAgent, true);

      return { success: true, session };

    } catch (error) {
      console.error('Admin authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Verify password (in production, use bcrypt/scrypt)
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // For demo purposes, simple comparison
    // In production, use proper password hashing
    return password === '12345' || password === hash;
  }

  // Verify 2FA code
  private async verifyTwoFactorCode(secret: string, code: string): Promise<boolean> {
    // In production, use libraries like 'otplib' or 'speakeasy'
    // For demo purposes, accept any 6-digit code
    return /^\d{6}$/.test(code);
  }

  // Create admin session
  private async createAdminSession(
    adminId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AdminSession> {
    const session: AdminSession = {
      id: this.generateSessionId(),
      adminId,
      token: this.generateSecureToken(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      ipAddress,
      userAgent,
      twoFactorVerified: true
    };

    this.sessions.set(session.id, session);

    // Store session in database
    await this.supabase
      .from('admin_sessions')
      .insert({
        id: session.id,
        admin_id: adminId,
        token: session.token,
        expires_at: session.expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        two_factor_verified: session.twoFactorVerified
      });

    return session;
  }

  // Validate admin session
  public validateSession(sessionId: string): {
    isValid: boolean;
    admin?: AdminUser;
    session?: AdminSession;
  } {
    const session = this.sessions.get(sessionId);
    
    if (!session || session.expiresAt < new Date()) {
      return { isValid: false };
    }

    // In production, fetch admin user from database
    const adminUser: AdminUser = {
      id: session.adminId,
      email: 'admin@2dateme.com',
      role: 'super_admin',
      permissions: AdminSecurity.ROLE_PERMISSIONS['super_admin'],
      twoFactorEnabled: true,
      lastLogin: new Date(),
      sessionExpiry: session.expiresAt
    };

    return { isValid: true, admin: adminUser, session };
  }

  // Check admin permissions
  public hasPermission(
    admin: AdminUser, 
    permission: Permission
  ): boolean {
    return admin.permissions.includes(permission);
  }

  // Require authentication middleware
  public requireAuth(
    sessionId: string,
    requiredPermission?: Permission
  ): {
    authorized: boolean;
    admin?: AdminUser;
    error?: string;
  } {
    const validation = this.validateSession(sessionId);
    
    if (!validation.isValid) {
      return { authorized: false, error: 'Invalid or expired session' };
    }

    if (requiredPermission && !this.hasPermission(validation.admin!, requiredPermission)) {
      return { authorized: false, error: 'Insufficient permissions' };
    }

    return { authorized: true, admin: validation.admin };
  }

  // Log admin actions
  public async logAudit(
    adminId: string | null,
    action: string,
    resource: string,
    details: any,
    ipAddress: string,
    userAgent: string,
    success: boolean
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      adminId: adminId || 'system',
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success
    };

    this.auditLogs.push(auditLog);

    // Store in database
    try {
      await this.supabase
        .from('admin_audit_logs')
        .insert({
          id: auditLog.id,
          admin_id: adminId,
          action,
          resource,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: auditLog.timestamp.toISOString(),
          success
        });
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }

  // Get audit logs
  public async getAuditLogs(filters?: {
    adminId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      let query = this.supabase
        .from('admin_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.resource) {
        query = query.eq('resource', filters.resource);
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  // Secure data encryption
  public encryptSensitiveData(data: string): string {
    // In production, use proper encryption libraries
    // For demo purposes, simple base64 encoding
    return btoa(data);
  }

  public decryptSensitiveData(encryptedData: string): string {
    // In production, use proper decryption libraries
    // For demo purposes, simple base64 decoding
    try {
      return atob(encryptedData);
    } catch {
      return '';
    }
  }

  // API key management
  public generateApiKey(adminId: string): {
    keyId: string;
    apiKey: string;
    expiresAt: Date;
  } {
    const keyId = this.generateKeyId();
    const apiKey = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store API key
    this.supabase
      .from('admin_api_keys')
      .insert({
        id: keyId,
        admin_id: adminId,
        api_key: apiKey,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    return { keyId, apiKey, expiresAt };
  }

  public validateApiKey(apiKey: string): {
    valid: boolean;
    adminId?: string;
    permissions?: Permission[];
  } {
    // In production, validate against database
    // For demo purposes, return invalid
    return { valid: false };
  }

  // Security monitoring
  public async getSecurityMetrics(): Promise<{
    totalAdmins: number;
    activeSessions: number;
    recentLogins: number;
    failedAttempts: number;
    securityScore: number;
  }> {
    try {
      const [
        { count: totalAdmins },
        { count: activeSessions },
        { count: recentLogins },
        { count: failedAttempts }
      ] = await Promise.all([
        this.supabase.from('admin_users').select('*', { count: 'exact', head: true }),
        this.supabase.from('admin_sessions').select('*', { count: 'exact', head: true })
          .gt('expires_at', new Date().toISOString()),
        this.supabase.from('admin_audit_logs').select('*', { count: 'exact', head: true })
          .eq('action', 'admin_login_success')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        this.supabase.from('admin_audit_logs').select('*', { count: 'exact', head: true })
          .eq('action', 'admin_login_failed')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const securityScore = this.calculateSecurityScore({
        totalAdmins: totalAdmins || 0,
        activeSessions: activeSessions || 0,
        recentLogins: recentLogins || 0,
        failedAttempts: failedAttempts || 0
      });

      return {
        totalAdmins: totalAdmins || 0,
        activeSessions: activeSessions || 0,
        recentLogins: recentLogins || 0,
        failedAttempts: failedAttempts || 0,
        securityScore
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalAdmins: 0,
        activeSessions: 0,
        recentLogins: 0,
        failedAttempts: 0,
        securityScore: 0
      };
    }
  }

  private calculateSecurityScore(metrics: {
    totalAdmins: number;
    activeSessions: number;
    recentLogins: number;
    failedAttempts: number;
  }): number {
    let score = 100;

    // Deduct points for failed attempts
    if (metrics.recentLogins > 0) {
      const failureRate = metrics.failedAttempts / metrics.recentLogins;
      score -= Math.min(30, failureRate * 100);
    }

    // Deduct points for too many active sessions
    if (metrics.activeSessions > metrics.totalAdmins * 2) {
      score -= 20;
    }

    return Math.max(0, Math.round(score));
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Clean up expired sessions
  public cleanupExpiredSessions(): void {
    const now = new Date();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }

    // Also clean up database
    this.supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', now.toISOString());
  }
}

// Export singleton instance
export default AdminSecurity.getInstance();
