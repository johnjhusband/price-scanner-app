const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);

class TokenService {
  constructor() {
    // In production, this would use Redis or database
    this.refreshTokens = new Map();
    this.blacklistedTokens = new Set();
  }

  // Store refresh token with metadata
  async storeRefreshToken(userId, token, metadata = {}) {
    const tokenData = {
      userId,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ...metadata,
      fingerprint: metadata.fingerprint || null,
      family: metadata.family || await this.generateTokenFamily(),
      used: false,
    };

    // In production: await db.refreshTokens.create(tokenData);
    this.refreshTokens.set(token, tokenData);

    // Clean up old tokens for this user
    await this.cleanupUserTokens(userId);

    return tokenData;
  }

  // Validate and rotate refresh token
  async rotateRefreshToken(oldToken, fingerprint = null) {
    const tokenData = this.refreshTokens.get(oldToken);
    
    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    // Check if token has been used (potential token reuse attack)
    if (tokenData.used) {
      // Revoke all tokens in the family
      await this.revokeTokenFamily(tokenData.family);
      throw new Error('Token reuse detected - all tokens revoked');
    }

    // Check expiration
    if (new Date() > tokenData.expiresAt) {
      this.refreshTokens.delete(oldToken);
      throw new Error('Refresh token expired');
    }

    // Validate fingerprint if provided
    if (fingerprint && tokenData.fingerprint && fingerprint !== tokenData.fingerprint) {
      throw new Error('Invalid token fingerprint');
    }

    // Mark old token as used
    tokenData.used = true;
    this.refreshTokens.set(oldToken, tokenData);

    // Return user data for new token generation
    return {
      userId: tokenData.userId,
      family: tokenData.family,
      metadata: {
        fingerprint: tokenData.fingerprint,
        family: tokenData.family,
      }
    };
  }

  // Revoke specific token
  async revokeToken(token) {
    this.refreshTokens.delete(token);
    this.blacklistedTokens.add(token);
  }

  // Revoke all tokens for a user
  async revokeUserTokens(userId) {
    const tokensToRevoke = [];
    
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        tokensToRevoke.push(token);
      }
    }

    for (const token of tokensToRevoke) {
      await this.revokeToken(token);
    }

    return tokensToRevoke.length;
  }

  // Revoke all tokens in a family (for security breach)
  async revokeTokenFamily(family) {
    const tokensToRevoke = [];
    
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.family === family) {
        tokensToRevoke.push(token);
      }
    }

    for (const token of tokensToRevoke) {
      await this.revokeToken(token);
    }

    return tokensToRevoke.length;
  }

  // Check if token is blacklisted
  isBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    const now = new Date();
    const tokensToDelete = [];

    for (const [token, data] of this.refreshTokens.entries()) {
      if (now > data.expiresAt) {
        tokensToDelete.push(token);
      }
    }

    for (const token of tokensToDelete) {
      this.refreshTokens.delete(token);
    }

    return tokensToDelete.length;
  }

  // Limit tokens per user
  async cleanupUserTokens(userId, maxTokens = 5) {
    const userTokens = [];
    
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        userTokens.push({ token, createdAt: data.createdAt });
      }
    }

    // Sort by creation date (oldest first)
    userTokens.sort((a, b) => a.createdAt - b.createdAt);

    // Remove oldest tokens if over limit
    const tokensToRemove = userTokens.slice(0, Math.max(0, userTokens.length - maxTokens));
    
    for (const { token } of tokensToRemove) {
      this.refreshTokens.delete(token);
    }

    return tokensToRemove.length;
  }

  // Generate token family ID
  async generateTokenFamily() {
    const buffer = await randomBytes(16);
    return buffer.toString('hex');
  }

  // Get active sessions for user
  async getUserSessions(userId) {
    const sessions = [];
    
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId && !data.used) {
        sessions.push({
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          fingerprint: data.fingerprint,
          lastUsed: data.lastUsed || data.createdAt,
        });
      }
    }

    return sessions;
  }

  // Scheduled cleanup task
  startCleanupTask(intervalMs = 60 * 60 * 1000) { // 1 hour
    setInterval(async () => {
      try {
        const cleaned = await this.cleanupExpiredTokens();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired refresh tokens`);
        }
      } catch (error) {
        console.error('Error during token cleanup:', error);
      }
    }, intervalMs);
  }
}

// Export singleton instance
module.exports = new TokenService();