#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'devtools-ui');
const extensionDir = path.join(rootDir, 'extension');
const panelDir = path.join(extensionDir, 'devtools', 'panel');
const buildDir = path.join(uiDir, 'build');

console.log('Building React app for extension...');

process.chdir(uiDir);

// Проверяем наличие node_modules
const nodeModulesPath = path.join(uiDir, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('Installing dependencies for devtools-ui...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

try {
  process.env.PUBLIC_URL = '.';
  execSync('npm run build', { stdio: 'inherit', env: process.env });
} catch (error) {
  console.error('Failed to build React app:', error.message);
  process.exit(1);
}

console.log('Copying build files to extension...');

if (!fs.existsSync(panelDir)) {
  fs.mkdirSync(panelDir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(panelDir)) {
  fs.readdirSync(panelDir).forEach((file) => {
    const filePath = path.join(panelDir, file);
    if (fs.statSync(filePath).isDirectory() && file !== 'node_modules') {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else if (!file.endsWith('.html')) {
      fs.unlinkSync(filePath);
    }
  });
}

copyRecursiveSync(buildDir, panelDir);

const buildIndexHtml = path.join(buildDir, 'index.html');
const panelHtml = path.join(panelDir, 'panel.html');

if (fs.existsSync(buildIndexHtml)) {
  let indexHtmlContent = fs.readFileSync(buildIndexHtml, 'utf8');
  
  indexHtmlContent = indexHtmlContent.replace(
    /href="(\/static\/[^"]+)"/g,
    (match, p1) => `href=".${p1}"`
  );
  indexHtmlContent = indexHtmlContent.replace(
    /src="(\/static\/[^"]+)"/g,
    (match, p1) => `src=".${p1}"`
  );
  
  fs.writeFileSync(panelHtml, indexHtmlContent);
  console.log('✓ Updated panel.html with built files');
} else {
  console.warn('Warning: index.html not found in build directory');
  const basicHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rellx DevTools</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
  fs.writeFileSync(panelHtml, basicHtml);
}

console.log('Extension build completed!');
console.log(`Files copied to: ${panelDir}`);

