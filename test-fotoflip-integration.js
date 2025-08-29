#!/usr/bin/env node
/**
 * FotoFlip Integration Test & Audit
 * Run from project root
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Results tracking
let passed = 0;
let failed = 0;
let warnings = 0;
const issues = [];

// Console colors
const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`)
};

async function runTests() {
  console.log('\n========== FOTOFLIP INTEGRATION AUDIT ==========\n');

  // Test 1: Check required files exist
  console.log('📁 Checking Required Files...\n');
  const requiredFiles = [
    'backend/services/fotoflip/index.js',
    'backend/services/fotoflip/processor.js',
    'backend/services/fotoflip/imgbb-uploader.js',
    'backend/routes/fotoflip.js',
    'mobile-app/App.js',
    'backend/.env.example'
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      log.success(`Found: ${file}`);
      passed++;
    } catch {
      log.error(`Missing: ${file}`);
      failed++;
      issues.push(`Missing file: ${file}`);
    }
  }

  // Test 2: Check backend dependencies
  console.log('\n📦 Checking Dependencies...\n');
  try {
    const packageJson = JSON.parse(await fs.readFile('backend/package.json', 'utf8'));
    const requiredDeps = ['sharp', 'form-data', 'node-fetch', 'multer'];
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep]) {
        log.success(`Dependency found: ${dep}`);
        passed++;
      } else {
        log.error(`Missing dependency: ${dep}`);
        failed++;
        issues.push(`Missing npm dependency: ${dep}`);
      }
    }
  } catch (error) {
    log.error('Failed to read package.json');
    failed++;
  }

  // Test 3: Check environment variables documented
  console.log('\n🔑 Checking Environment Variables...\n');
  try {
    const envExample = await fs.readFile('backend/.env.example', 'utf8');
    const requiredEnvs = [
      'ENABLE_LUXE_PHOTO',
      'FOTOFLIP_BG_COLOR',
      'FOTOFLIP_MODE',
      'IMGBB_API_KEY'
    ];

    for (const env of requiredEnvs) {
      if (envExample.includes(env)) {
        log.success(`Documented: ${env}`);
        passed++;
      } else {
        log.error(`Not documented: ${env}`);
        failed++;
        issues.push(`Env var not documented: ${env}`);
      }
    }
  } catch (error) {
    log.error('Failed to read .env.example');
    failed++;
  }

  // Test 4: Check server.js integration
  console.log('\n🔌 Checking API Integration...\n');
  try {
    const serverJs = await fs.readFile('backend/server.js', 'utf8');
    
    if (serverJs.includes("require('./routes/fotoflip')")) {
      log.success('FotoFlip routes imported');
      passed++;
    } else {
      log.error('FotoFlip routes not imported');
      failed++;
      issues.push('FotoFlip routes not imported in server.js');
    }

    if (serverJs.includes('/api/fotoflip')) {
      log.success('FotoFlip routes mounted at /api/fotoflip');
      passed++;
    } else {
      log.error('FotoFlip routes not mounted');
      failed++;
      issues.push('FotoFlip routes not mounted in server.js');
    }
  } catch (error) {
    log.error('Failed to read server.js');
    failed++;
  }

  // Test 5: Check frontend integration
  console.log('\n🎨 Checking Frontend Integration...\n');
  try {
    const appJs = await fs.readFile('mobile-app/App.js', 'utf8');
    
    if (appJs.includes('handleLuxePhoto')) {
      log.success('handleLuxePhoto function exists');
      passed++;
    } else {
      log.error('handleLuxePhoto function missing');
      failed++;
      issues.push('handleLuxePhoto function not found');
    }

    if (appJs.includes("window.location.hostname === 'blue.flippi.ai'")) {
      log.success('Blue environment protection exists');
      passed++;
    } else {
      log.error('Blue environment protection missing');
      failed++;
      issues.push('Missing blue.flippi.ai environment check');
    }

    if (appJs.includes('Luxe Photo')) {
      log.success('Luxe Photo button exists');
      passed++;
    } else {
      log.error('Luxe Photo button missing');
      failed++;
    }

    if (appJs.includes('/api/fotoflip/luxe-photo')) {
      log.success('API endpoint correctly referenced');
      passed++;
    } else {
      log.error('API endpoint not referenced');
      failed++;
    }
  } catch (error) {
    log.error('Failed to read App.js');
    failed++;
  }

  // Test 6: Security checks
  console.log('\n🔒 Security Checks...\n');
  const filesToScan = [
    'backend/services/fotoflip/processor.js',
    'backend/services/fotoflip/imgbb-uploader.js',
    'backend/routes/fotoflip.js'
  ];

  for (const file of filesToScan) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Check for hardcoded API keys
      if (content.match(/sk-[a-zA-Z0-9]{48}/)) {
        log.error(`Hardcoded API key found in ${file}`);
        failed++;
        issues.push(`Security: Hardcoded API key in ${file}`);
      } else {
        log.success(`No hardcoded keys in ${file}`);
        passed++;
      }

      // Check for file size limit
      if (file.includes('routes') && content.includes('fileSize')) {
        log.success('File size limit configured');
        passed++;
      }
    } catch (error) {
      log.warning(`Could not scan ${file}`);
      warnings++;
    }
  }

  // Test 7: Check Python dependencies
  console.log('\n🐍 Checking Python Dependencies...\n');
  await new Promise((resolve) => {
    const pythonCheck = spawn('python3', ['-c', 'import rembg']);
    pythonCheck.on('close', (code) => {
      if (code === 0) {
        log.success('Python rembg installed locally');
        passed++;
      } else {
        log.warning('Python rembg not installed (needs server installation)');
        warnings++;
        issues.push('Server needs: pip install rembg onnxruntime');
      }
      resolve();
    });
    pythonCheck.on('error', () => {
      log.warning('Python3 not available');
      warnings++;
      resolve();
    });
  });

  // Summary
  console.log('\n========== AUDIT SUMMARY ==========\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);

  if (issues.length > 0) {
    console.log('\n🚨 Issues to Fix:\n');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }

  // Risk Assessment
  console.log('\n========== RISK ASSESSMENT ==========\n');
  
  const risks = {
    high: [],
    medium: [],
    low: []
  };

  // Analyze risks
  if (issues.some(i => i.includes('Missing file'))) {
    risks.high.push('Missing required files - deployment will fail');
  }
  if (issues.some(i => i.includes('not mounted'))) {
    risks.high.push('API routes not accessible - feature won\'t work');
  }
  if (issues.some(i => i.includes('Security'))) {
    risks.high.push('Security vulnerability - exposed credentials');
  }
  if (issues.some(i => i.includes('pip install'))) {
    risks.medium.push('Python dependencies need installation on server');
  }
  if (issues.some(i => i.includes('Env var'))) {
    risks.low.push('Environment variables need configuration on server');
  }

  if (risks.high.length > 0) {
    console.log('🔴 HIGH RISK:');
    risks.high.forEach(r => console.log(`  - ${r}`));
  }
  if (risks.medium.length > 0) {
    console.log('\n🟡 MEDIUM RISK:');
    risks.medium.forEach(r => console.log(`  - ${r}`));
  }
  if (risks.low.length > 0) {
    console.log('\n🟢 LOW RISK:');
    risks.low.forEach(r => console.log(`  - ${r}`));
  }

  // Deployment readiness
  console.log('\n========== DEPLOYMENT READINESS ==========\n');
  
  if (failed === 0 && risks.high.length === 0) {
    console.log('✅ READY FOR DEPLOYMENT TO BLUE ENVIRONMENT');
    console.log('\nNext steps:');
    console.log('1. Commit and push to develop branch');
    console.log('2. Set environment variables on blue server:');
    console.log('   - ENABLE_LUXE_PHOTO=true');
    console.log('   - IMGBB_API_KEY=<your-key>');
    console.log('   - FOTOFLIP_BG_COLOR=#FAF6F1');
    console.log('3. Install Python dependencies on server:');
    console.log('   - sudo apt-get update');
    console.log('   - sudo apt-get install python3-pip');
    console.log('   - pip3 install rembg onnxruntime');
    console.log('4. Test on blue.flippi.ai');
  } else {
    console.log('❌ NOT READY FOR DEPLOYMENT');
    console.log(`\n${failed} critical issues must be fixed first`);
  }

  console.log('\n=======================================\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});