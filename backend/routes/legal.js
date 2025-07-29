const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Serve legal pages directly from backend
router.get('/terms', (req, res) => {
  const termsPath = path.join(__dirname, '../../mobile-app/terms.html');
  
  if (fs.existsSync(termsPath)) {
    res.sendFile(termsPath);
  } else {
    res.status(404).send('Terms page not found');
  }
});

router.get('/privacy', (req, res) => {
  const privacyPath = path.join(__dirname, '../../mobile-app/privacy.html');
  
  if (fs.existsSync(privacyPath)) {
    res.sendFile(privacyPath);
  } else {
    res.status(404).send('Privacy page not found');
  }
});

module.exports = router;