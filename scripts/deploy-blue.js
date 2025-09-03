#!/usr/bin/env node

const { execSync } = require('child_process');

const WORKFLOW_ID = process.env.DEPLOY_WORKFLOW_ID || '174406331';
const REF = process.env.DEPLOY_REF || 'develop';

console.log(`✨ Deploying ${REF} → blue environment 💙`);

try {
  execSync(`gh workflow run ${WORKFLOW_ID} --ref ${REF}`, { stdio: 'inherit' });
  console.log('\n🎉 Deployment triggered successfully! ⭐');
  console.log('💫 Your changes are on their way to blue.flippi.ai');
  console.log('📍 Track progress at: https://github.com/johnjhusband/price-scanner-app/actions');
  console.log('\n💕 Happy deploying!');
} catch (error) {
  console.error('\n💔 Oh no! Deployment failed:', error.message);
  console.error('💡 Tip: Make sure you have gh CLI installed and authenticated');
  process.exit(1);
}