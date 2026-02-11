#!/usr/bin/env node

const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const opportunities = raw.opportunities || [];

console.log(`Generating crypto dashboard with ${opportunities.length} opportunities (with 15min history charts)`);

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('%OPPORTUNITIES_JSON%', JSON.stringify(opportunities));
fs.writeFileSync('index.html', html);
console.log('✅ index.html generated');
