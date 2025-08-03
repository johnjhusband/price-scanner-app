// Setup legal pages middleware for Express
// This ensures legal pages are served correctly regardless of nginx configuration

const express = require('express');
const path = require('path');
const fs = require('fs');

function setupLegalPages(app) {
  // Serve legal pages with explicit routes BEFORE other middleware
  const legalPagesPath = path.join(__dirname, '../mobile-app');
  
  console.log('Setting up legal pages from:', legalPagesPath);
  
  // Terms page
  app.get('/terms', (req, res) => {
    const termsPath = path.join(legalPagesPath, 'terms.html');
    console.log('Serving terms page from:', termsPath);
    
    // Check if file exists first
    if (fs.existsSync(termsPath)) {
      res.sendFile(termsPath, (err) => {
        if (err) {
          console.error('Error serving terms.html:', err);
          res.status(500).send('Error loading terms page');
        }
      });
    } else {
      console.error('terms.html not found at:', termsPath);
      res.status(404).send('Terms page not found');
    }
  });
  
  // Privacy page
  app.get('/privacy', (req, res) => {
    const privacyPath = path.join(legalPagesPath, 'privacy.html');
    console.log('Serving privacy page from:', privacyPath);
    
    // Check if file exists first
    if (fs.existsSync(privacyPath)) {
      res.sendFile(privacyPath, (err) => {
        if (err) {
          console.error('Error serving privacy.html:', err);
          res.status(500).send('Error loading privacy page');
        }
      });
    } else {
      console.error('privacy.html not found at:', privacyPath);
      res.status(404).send('Privacy page not found');
    }
  });
  
  console.log('Legal pages routes configured at /terms and /privacy');
}

module.exports = setupLegalPages;