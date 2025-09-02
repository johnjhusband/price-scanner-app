#!/usr/bin/env node

/**
 * Test script for growth routes (Issue #156)
 * Verifies that growth routes are not redirecting to React app
 */

const https = require('https');

const testUrl = 'https://blue.flippi.ai';
const routes = [
    '/growth',
    '/growth/questions',
    '/growth/admin',
    '/growth/analytics'
];

async function testRoute(route) {
    return new Promise((resolve) => {
        const fullUrl = testUrl + route;
        console.log(`Testing ${fullUrl}...`);
        
        https.get(fullUrl, { 
            headers: { 'Accept': 'text/html' },
            timeout: 10000
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const isReactApp = data.includes('root') && data.includes('Loading flippi.ai');
                const hasGrowthContent = data.includes('growth') || data.includes('question');
                
                const result = {
                    route,
                    statusCode: res.statusCode,
                    isReactApp,
                    hasGrowthContent,
                    passed: res.statusCode === 200 && !isReactApp
                };
                
                console.log(`  Status: ${res.statusCode}`);
                console.log(`  Is React App: ${isReactApp}`);
                console.log(`  Has Growth Content: ${hasGrowthContent}`);
                console.log(`  Result: ${result.passed ? 'PASS' : 'FAIL'}`);
                console.log('');
                
                resolve(result);
            });
        }).on('error', (err) => {
            console.error(`  Error: ${err.message}`);
            console.log('');
            resolve({
                route,
                statusCode: 0,
                error: err.message,
                passed: false
            });
        });
    });
}

async function runTests() {
    console.log('Growth Routes Test Suite');
    console.log('========================\n');
    
    const results = [];
    
    for (const route of routes) {
        const result = await testRoute(route);
        results.push(result);
    }
    
    console.log('Summary');
    console.log('=======');
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\nFailed routes:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.route} (${r.error || 'redirected to React app'})`);
        });
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);