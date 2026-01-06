#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const versionType = args[0]; // 'major', 'minor', 'patch'

if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('Usage: node scripts/version.js <major|minor|patch>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const corePackageJson = path.join(rootDir, '..', 'rellx-core', 'package.json');
const devtoolsPackageJson = path.join(rootDir, 'package.json');
const extensionManifest = path.join(rootDir, 'extension', 'manifest.json');

if (!fs.existsSync(corePackageJson)) {
  console.error(`Error: ${corePackageJson} not found`);
  process.exit(1);
}

const corePackage = JSON.parse(fs.readFileSync(corePackageJson, 'utf8'));
const currentVersion = corePackage.version;
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

console.log(`Updating version from ${currentVersion} to ${newVersion}...`);

corePackage.version = newVersion;
fs.writeFileSync(
  corePackageJson,
  JSON.stringify(corePackage, null, 2) + '\n'
);
console.log(`✓ Updated ${corePackageJson}`);

// Update rellx-devtools package.json
if (fs.existsSync(devtoolsPackageJson)) {
  const devtoolsPackage = JSON.parse(fs.readFileSync(devtoolsPackageJson, 'utf8'));
  devtoolsPackage.version = newVersion;
  // Also update rellx dependency version
  if (devtoolsPackage.dependencies && devtoolsPackage.dependencies.rellx) {
    devtoolsPackage.dependencies.rellx = `^${newVersion}`;
  }
  if (devtoolsPackage.peerDependencies && devtoolsPackage.peerDependencies.rellx) {
    devtoolsPackage.peerDependencies.rellx = `^${newVersion}`;
  }
  fs.writeFileSync(
    devtoolsPackageJson,
    JSON.stringify(devtoolsPackage, null, 2) + '\n'
  );
  console.log(`✓ Updated ${devtoolsPackageJson}`);
}

if (fs.existsSync(extensionManifest)) {
  const manifest = JSON.parse(fs.readFileSync(extensionManifest, 'utf8'));
  manifest.version = newVersion;
  fs.writeFileSync(
    extensionManifest,
    JSON.stringify(manifest, null, 2) + '\n'
  );
  console.log(`✓ Updated ${extensionManifest}`);
}

console.log(`\nVersion updated to ${newVersion}`);
console.log('\nNext steps:');
console.log('1. Commit the changes');
console.log('2. Create a git tag: git tag v' + newVersion);
console.log('3. Push: git push && git push --tags');
console.log('4. Publish to npm:');
console.log('   - cd rellx-core && npm publish');
console.log('   - cd rellx-devtools && npm publish');

