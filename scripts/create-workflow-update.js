#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the working staging workflow
const stagingWorkflow = fs.readFileSync('staging-workflow.yml', 'utf8');

// Adapt it for development/blue
const developWorkflow = stagingWorkflow
  .replace(/Deploy Staging/g, 'Deploy Development')
  .replace(/staging/g, 'develop')
  .replace(/green\.flippi\.ai/g, 'blue.flippi.ai')
  .replace(/staging-backend/g, 'dev-backend')
  .replace(/staging-frontend/g, 'dev-frontend')
  .replace(/:3001/g, ':3002')
  .replace(/branches: \[develop\]/, 'branches: [develop]\n  workflow_dispatch:');

// Create the workflow file
const workflowPath = '.github/workflows/deploy-develop-fixed.yml';
fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
fs.writeFileSync(workflowPath, developWorkflow);

console.log('✨ Created deploy-develop-fixed.yml based on working staging workflow');
console.log('💫 Added workflow_dispatch trigger for manual deployments');
console.log('⭐ Ready to commit and push!');