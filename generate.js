#!/usr/bin/env node

const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const opportunities = raw.opportunities || [];

console.log(`Generating crypto dashboard with ${opportunities.length} opportunities`);

// Read template
let html = fs.readFileSync('index.html', 'utf8');

// Replace opportunities placeholder
html = html.replace('%OPPORTUNITIES_JSON%', JSON.stringify(opportunities));

// Write final
fs.writeFileSync('index.html', html);
console.log('✅ index.html generated');
