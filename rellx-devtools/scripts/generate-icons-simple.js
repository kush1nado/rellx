#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, '..', 'extension', 'icons');

// Создаем простые PNG через canvas в Node.js (если доступен)
// Или используем ImageMagick/convert если доступен

console.log('Generating icons...');

// Попробуем использовать sharp
try {
  const sharp = require('sharp');
  const svgPath = path.join(iconsDir, 'icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found. Creating simple SVG...');
    const simpleSvg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#6366f1"/>
  <text x="64" y="92" font-family="Arial" font-size="80" font-weight="bold" fill="white" text-anchor="middle">R</text>
</svg>`;
    fs.writeFileSync(svgPath, simpleSvg);
  }
  
  const svgBuffer = fs.readFileSync(svgPath);
  const sizes = [16, 48, 128];
  
  Promise.all(sizes.map(size => 
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon${size}.png`))
      .then(() => console.log(`✓ Generated icon${size}.png`))
  )).then(() => {
    console.log('\nAll icons generated!');
  }).catch(err => {
    console.error('Error:', err.message);
    fallbackMethod();
  });
  
} catch (err) {
  console.log('Sharp not available, trying alternative method...');
  fallbackMethod();
}

function fallbackMethod() {
  console.log('\nPlease install sharp: npm install --save-dev sharp');
  console.log('Or use online converter to convert icon.svg to PNG files:');
  console.log('  - icon16.png (16x16)');
  console.log('  - icon48.png (48x48)');
  console.log('  - icon128.png (128x128)');
}

