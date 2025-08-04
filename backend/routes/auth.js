const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import database
const { getDatabase } = require('../database');

// Initialize users table
const initUsersTable = () => {
  try {
    const db = getDatabase();
    if (!db) {
      console.error('No database available for users');
      return;
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        picture_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error in initUsersTable:', error.message);
  }
};

// Initialize on module load
try {
  initUsersTable();
} catch (error) {
  console.error('Failed to initialize users table:', error.message);
  // Continue without database - auth will not work properly
}

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      proxy: true  // Trust the proxy (nginx) for https
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const db = getDatabase();
      if (!db) {
        return done(new Error('Database not available'));
      }

      // Extract user data from Google profile
      const userData = {
        google_id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture_url: profile.photos[0]?.value
      };

      // Check if user exists
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(userData.google_id);

      if (user) {
        // Update last login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?')
          .run(userData.google_id);
      } else {
        // Create new user
        const result = db.prepare(`
          INSERT INTO users (google_id, email, name, picture_url)
          VALUES (?, ?, ?, ?)
        `).run(userData.google_id, userData.email, userData.name, userData.picture_url);
        
        user = { id: result.lastInsertRowid, ...userData };
      }

      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error);
    }
  }
  ));
} else {
  console.warn('Google OAuth credentials not configured. OAuth will not work.');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.google_id);
});

passport.deserializeUser((google_id, done) => {
  try {
    const db = getDatabase();
    if (!db) {
      return done(new Error('Database not available'));
    }
  
    const user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(google_id);
    done(null, user);
  } catch (error) {
    console.error('Error in deserializeUser:', error.message);
    done(error);
  }
});

// Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '30d' }
    );

    // Redirect to frontend with token
    // Determine frontend URL based on the request host
    let frontendUrl;
    const host = req.get('host');
    
    if (host && host.includes('green.flippi.ai')) {
      frontendUrl = 'https://green.flippi.ai';
    } else if (host && host.includes('blue.flippi.ai')) {
      frontendUrl = 'https://blue.flippi.ai';
    } else if (process.env.NODE_ENV === 'production') {
      frontendUrl = 'https://app.flippi.ai';
    } else if (process.env.NODE_ENV === 'staging') {
      frontendUrl = 'https://green.flippi.ai';
    } else {
      frontendUrl = 'https://blue.flippi.ai';
    }
    
    res.redirect(`${frontendUrl}?token=${token}`);
  }
);

router.get('/exit', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Exit failed' });
    }
    res.json({ success: true, message: 'Exited successfully' });
  });
});

router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture_url
    } : null
  });
});

router.get('/you', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture_url,
    created_at: req.user.created_at,
    last_login: req.user.last_login
  });
});

// Admin route to get all users (protect this in production!)
router.get('/users/all', (req, res) => {
  const db = getDatabase();
  if (!db) {
    return res.status(500).json({ error: 'Database not available' });
  }
  
  // In production, add admin check here
  const users = db.prepare('SELECT email, name, created_at, last_login FROM users ORDER BY created_at DESC').all();
  
  res.json({
    count: users.length,
    users: users
  });
});

module.exports = router;