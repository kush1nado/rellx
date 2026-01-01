#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'extension', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

const svgContent = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#6366f1"/>
  <text x="64" y="92" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">R</text>
</svg>`;

if (!fs.existsSync(svgPath)) {
  fs.writeFileSync(svgPath, svgContent);
  console.log('✓ Created icon.svg');
}

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.log('Sharp not found. Installing sharp...');
  const { execSync } = require('child_process');
  const rootDir = path.resolve(__dirname, '..');
  
  try {
    execSync('npm install --save-dev sharp', { 
      stdio: 'inherit', 
      cwd: rootDir 
    });
    console.log('\nSharp installed. Please run the script again:');
    console.log('  npm run generate-icons');
    process.exit(0);
  } catch (installErr) {
    console.error('\nFailed to install sharp automatically.');
    console.log('\nPlease install manually:');
    console.log('  cd rellx-devtools');
    console.log('  npm install --save-dev sharp');
    console.log('  npm run generate-icons');
    process.exit(1);
  }
}

console.log('Generating PNG icons from SVG...');

const svgBuffer = fs.readFileSync(svgPath);
const sizes = [16, 48, 128];

Promise.all(sizes.map(size => {
  const outputPath = path.join(iconsDir, `icon${size}.png`);
  return sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath)
    .then(() => console.log(`✓ Generated icon${size}.png (${size}x${size})`))
    .catch(err => {
      console.error(`✗ Failed to generate icon${size}.png:`, err.message);
      throw err;
    });
})).then(() => {
  console.log('\nAll icons generated successfully!');
}).catch(err => {
  console.error('\nError generating icons:', err.message);
  process.exit(1);
});
