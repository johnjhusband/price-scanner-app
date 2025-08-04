// Setup legal pages middleware for Express
// This ensures legal pages are served correctly regardless of nginx configuration

const express = require('express');
const path = require('path');
const fs = require('fs');

function setupLegalPages(app) {
  // Serve legal pages with explicit routes BEFORE other middleware
  const legalPagesPath = path.join(__dirname, '../mobile-app');
  
  // Terms page
  app.get('/terms', (req, res) => {
    const termsPath = path.join(legalPagesPath, 'terms.html');
    
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
  
  // Mission page
  app.get('/mission', (req, res) => {
    const missionPath = path.join(legalPagesPath, 'mission.html');
    
    // Check if file exists first
    if (fs.existsSync(missionPath)) {
      res.sendFile(missionPath, (err) => {
        if (err) {
          console.error('Error serving mission.html:', err);
          res.status(500).send('Error loading mission page');
        }
      });
    } else {
      console.error('mission.html not found at:', missionPath);
      res.status(404).send('Mission page not found');
    }
  });
  
  // Contact page
  app.get('/contact', (req, res) => {
    const contactPath = path.join(legalPagesPath, 'contact.html');
    
    // Check if file exists first
    if (fs.existsSync(contactPath)) {
      res.sendFile(contactPath, (err) => {
        if (err) {
          console.error('Error serving contact.html:', err);
          res.status(500).send('Error loading contact page');
        }
      });
    } else {
      console.error('contact.html not found at:', contactPath);
      res.status(404).send('Contact page not found');
    }
  });
}

module.exports = setupLegalPages;