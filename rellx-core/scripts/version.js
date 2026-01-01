#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const versionType = args[0]; // 'major', 'minor', 'patch'

if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('Usage: npm run version <major|minor|patch>');
  console.error('   or: node scripts/version.js <major|minor|patch>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const packageJson = path.join(rootDir, 'package.json');
const devtoolsVersionScript = path.join(rootDir, '..', 'rellx-devtools', 'scripts', 'version.js');

// Используем скрипт из devtools для синхронизации версий
if (fs.existsSync(devtoolsVersionScript)) {
  try {
    execSync(`node "${devtoolsVersionScript}" ${versionType}`, {
      stdio: 'inherit',
      cwd: rootDir
    });
  } catch (error) {
    console.error('Failed to update version:', error.message);
    process.exit(1);
  }
} else {
  // Fallback: обновляем только core package.json
  const package = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const currentVersion = package.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  let newVersion;
  switch (versionType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  package.version = newVersion;
  fs.writeFileSync(packageJson, JSON.stringify(package, null, 2) + '\n');
  console.log(`Version updated from ${currentVersion} to ${newVersion}`);
}

