const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');

// Try to load QRCode module, fall back if not available
let QRCode;
try {
  QRCode = require('qrcode');
} catch (error) {
  console.error('[QR] qrcode module not available:', error.message);
  // Will use fallback QR generation
}

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
    
    let qrSvg;
    
    if (QRCode) {
      // Use proper QR library if available
      qrSvg = await QRCode.toString(url, {
        type: 'svg',
        width: parseInt(size),
        color: {
          dark: `#${dark}`,
          light: `#${light}`
        },
        margin: 2
      });
    } else {
      // Fallback: Create simple QR-like pattern
      qrSvg = generateFallbackQR(url, parseInt(size), dark, light);
    }
    
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
    
    let qrBuffer;
    
    if (QRCode) {
      // Generate QR code as PNG buffer
      qrBuffer = await QRCode.toBuffer(url, {
        type: 'png',
        width: parseInt(size),
        margin: 2
      });
    } else {
      // Return a simple 1x1 transparent PNG as fallback
      qrBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0x60, 0x00, 0x02, 0x00,
        0x00, 0x05, 0x00, 0x01, 0xE9, 0xFA, 0xDC, 0xD8,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
      ]);
    }
    
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

// Fallback QR generator when qrcode module is not available
function generateFallbackQR(text, size, dark, light) {
  const moduleSize = size / 25;
  
  // Create SVG with QR-like pattern
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="#${light}"/>`;
  
  // Add finder patterns (corners)
  const drawFinderPattern = (x, y) => {
    svg += `<rect x="${x}" y="${y}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="#${dark}"/>`;
    svg += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="#${light}"/>`;
    svg += `<rect x="${x + 2 * moduleSize}" y="${y + 2 * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="#${dark}"/>`;
  };
  
  drawFinderPattern(0, 0);
  drawFinderPattern(size - 7 * moduleSize, 0);
  drawFinderPattern(0, size - 7 * moduleSize);
  
  // Add timing patterns
  for (let i = 8; i < 17; i++) {
    if (i % 2 === 0) {
      svg += `<rect x="${i * moduleSize}" y="${6 * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#${dark}"/>`;
      svg += `<rect x="${6 * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#${dark}"/>`;
    }
  }
  
  // Add data pattern (simplified based on text)
  for (let i = 0; i < text.length && i < 100; i++) {
    const row = 8 + Math.floor(i / 9);
    const col = 8 + (i % 9);
    if (text.charCodeAt(i) % 2 === 0) {
      svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#${dark}"/>`;
    }
  }
  
  svg += '</svg>';
  return svg;
}

module.exports = router;