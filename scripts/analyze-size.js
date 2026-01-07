#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzePackage(packageName, distPath) {
  const esmPath = path.join(distPath, 'index.js');
  const cjsPath = path.join(distPath, 'index.cjs');
  
  const esmSize = getFileSize(esmPath);
  const cjsSize = getFileSize(cjsPath);
  
  return {
    name: packageName,
    esm: esmSize,
    cjs: cjsSize,
    total: esmSize + cjsSize
  };
}

console.log('📦 Bundle Size Analysis\n');

const core = analyzePackage('rellx-core', path.join(__dirname, '../rellx-core/dist'));
const devtools = analyzePackage('rellx-devtools', path.join(__dirname, '../rellx-devtools/dist'));

console.log(`${core.name}:`);
console.log(`  ESM: ${formatBytes(core.esm)}`);
console.log(`  CJS: ${formatBytes(core.cjs)}`);
console.log(`  Total: ${formatBytes(core.total)}\n`);

console.log(`${devtools.name}:`);
console.log(`  ESM: ${formatBytes(devtools.esm)}`);
console.log(`  CJS: ${formatBytes(devtools.cjs)}`);
console.log(`  Total: ${formatBytes(devtools.total)}\n`);

const grandTotal = core.total + devtools.total;
console.log(`Grand Total: ${formatBytes(grandTotal)}`);

