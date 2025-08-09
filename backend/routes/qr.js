const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { getDatabase } = require('../database');

// Generate QR code for valuation
router.get('/qr/value/:slug.svg', async (req, res) => {
  const { slug } = req.params;
  const { size = 300, dark = '000000', light = 'ffffff' } = req.query;
  
  try {
    // Verify valuation exists
    const db = getDatabase();
    const valuation = db.prepare('SELECT id, title FROM valuations WHERE slug = ? AND published = 1')
      .get(slug);
    
    if (!valuation) {
      return res.status(404).send('Not found');
    }
    
    // Generate URL with QR tracking
    const url = `https://flippi.ai/value/${slug}?src=qr`;
    
    // Generate QR code as SVG
    const qrSvg = await QRCode.toString(url, {
      type: 'svg',
      width: parseInt(size),
      color: {
        dark: `#${dark}`,
        light: `#${light}`
      },
      margin: 2
    });
    
    // Set caching headers
    res.set({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400' // 24 hours
    });
    
    res.send(qrSvg);
    
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).send('Error generating QR code');
  }
});

// Generate QR code as PNG
router.get('/qr/value/:slug.png', async (req, res) => {
  const { slug } = req.params;
  const { size = 300 } = req.query;
  
  try {
    // Verify valuation exists
    const db = getDatabase();
    const valuation = db.prepare('SELECT id, title FROM valuations WHERE slug = ? AND published = 1')
      .get(slug);
    
    if (!valuation) {
      return res.status(404).send('Not found');
    }
    
    // Generate URL with QR tracking
    const url = `https://flippi.ai/value/${slug}?src=qr`;
    
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: parseInt(size),
      margin: 2
    });
    
    // Set headers
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400'
    });
    
    res.send(qrBuffer);
    
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).send('Error generating QR code');
  }
});

// Generate printable QR sheet
router.get('/qr/value/:slug/print', async (req, res) => {
  const { slug } = req.params;
  
  try {
    const db = getDatabase();
    const valuation = db.prepare(`
      SELECT title, value_low, value_high, brand 
      FROM valuations 
      WHERE slug = ? AND published = 1
    `).get(slug);
    
    if (!valuation) {
      return res.status(404).send('Not found');
    }
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>QR Code - ${valuation.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .qr-card {
      text-align: center;
      border: 2px solid #10B981;
      border-radius: 12px;
      padding: 30px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .qr-code {
      margin: 20px 0;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .price {
      font-size: 32px;
      color: #10B981;
      font-weight: bold;
      margin: 10px 0;
    }
    .scan-text {
      font-size: 18px;
      color: #666;
      margin-top: 20px;
    }
    .logo {
      font-size: 20px;
      color: #10B981;
      font-weight: bold;
      margin-top: 15px;
    }
    @media print {
      body { margin: 0; }
      .qr-card { 
        border: 1px solid #ccc; 
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="qr-card">
    <div class="title">${valuation.title}</div>
    ${valuation.brand ? `<div style="color: #666; margin-bottom: 10px;">${valuation.brand}</div>` : ''}
    <div class="price">$${valuation.value_low} - $${valuation.value_high}</div>
    <div class="qr-code">
      <img src="/qr/value/${slug}.png?size=250" alt="QR Code">
    </div>
    <div class="scan-text">Scan for instant valuation</div>
    <div class="logo">flippi.ai</div>
  </div>
</body>
</html>`;
    
    res.send(html);
    
  } catch (error) {
    console.error('Error generating print page:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;