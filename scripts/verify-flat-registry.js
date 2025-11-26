#!/usr/bin/env node

/**
 * Verify flat registry compliance with registry index requirements
 *
 * Checks:
 * 1. No content property in files
 * 2. Source files exist at their paths
 * 3. Valid schema references
 * 4. Proper file types
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'public/r';
const REGISTRY_FILE = path.join(OUTPUT_DIR, 'registry.json');

console.log('🔍 Verifying flat registry compliance...\n');

let errors = 0;
let warnings = 0;

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read JSON file
 */
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    errors++;
    return null;
  }
}

/**
 * Verify registry.json exists and is valid
 */
function verifyMainRegistry() {
  console.log('📋 Verifying main registry.json...');

  if (!fileExists(REGISTRY_FILE)) {
    console.error(`❌ registry.json not found at ${REGISTRY_FILE}`);
    errors++;
    return null;
  }

  const registry = readJSON(REGISTRY_FILE);
  if (!registry) return null;

  // Check schema
  if (registry.$schema !== 'https://ui.shadcn.com/schema/registry.json') {
    console.error('❌ Invalid $schema in registry.json');
    errors++;
  } else {
    console.log('   ✓ Valid $schema');
  }

  // Check required fields
  if (!registry.name) {
    console.error('❌ Missing name in registry.json');
    errors++;
  } else {
    console.log(`   ✓ Name: ${registry.name}`);
  }

  if (!registry.homepage) {
    console.warn('⚠️  Missing homepage in registry.json');
    warnings++;
  } else {
    console.log(`   ✓ Homepage: ${registry.homepage}`);
  }

  if (!registry.items || !Array.isArray(registry.items)) {
    console.error('❌ Missing or invalid items array');
    errors++;
  } else {
    console.log(`   ✓ Items: ${registry.items.length}`);
  }

  console.log();
  return registry;
}

/**
 * Verify individual registry item
 */
function verifyRegistryItem(item) {
  const itemFilePath = path.join(OUTPUT_DIR, `${item.name}.json`);

  console.log(`📦 Verifying ${item.name}...`);

  // Check if item file exists
  if (!fileExists(itemFilePath)) {
    console.error(`   ❌ Item file not found: ${itemFilePath}`);
    errors++;
    return;
  }

  const itemJSON = readJSON(itemFilePath);
  if (!itemJSON) return;

  // Check schema
  if (itemJSON.$schema !== 'https://ui.shadcn.com/schema/registry-item.json') {
    console.error(`   ❌ Invalid $schema`);
    errors++;
  } else {
    console.log(`   ✓ Valid $schema`);
  }

  // Check required fields
  if (!itemJSON.name) {
    console.error(`   ❌ Missing name`);
    errors++;
  }

  if (!itemJSON.type) {
    console.error(`   ❌ Missing type`);
    errors++;
  } else {
    console.log(`   ✓ Type: ${itemJSON.type}`);
  }

  // Check files array for content property (MUST NOT have it)
  if (itemJSON.files && Array.isArray(itemJSON.files)) {
    let hasContentProperty = false;
    let filesWithContent = [];

    for (const file of itemJSON.files) {
      if ('content' in file) {
        hasContentProperty = true;
        filesWithContent.push(file.path);
      }
    }

    if (hasContentProperty) {
      console.error(`   ❌ CRITICAL: Files contain 'content' property`);
      console.error(`      This violates registry index requirements!`);
      console.error(`      Files with content: ${filesWithContent.length}`);
      filesWithContent.forEach((filePath) => {
        console.error(`        - ${filePath}`);
      });
      errors++;
    } else {
      console.log(`   ✓ No content property (registry index compatible)`);
    }

    // Verify source files exist
    let missingFiles = 0;
    for (const file of itemJSON.files) {
      const sourcePath = path.join(OUTPUT_DIR, file.path);
      if (!fileExists(sourcePath)) {
        if (missingFiles === 0) {
          console.error(`   ❌ Source files missing:`);
        }
        console.error(`      - ${file.path}`);
        missingFiles++;
      }
    }

    if (missingFiles > 0) {
      errors++;
    } else if (itemJSON.files.length > 0) {
      console.log(`   ✓ All ${itemJSON.files.length} source files exist`);
    }
  }

  console.log();
}

/**
 * Verify flat structure (no nested directories)
 */
function verifyFlatStructure() {
  console.log('📁 Verifying flat registry structure...\n');

  const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
  const directories = entries.filter((e) => e.isDirectory());

  if (directories.length > 0) {
    console.error('   ❌ Found nested directories (registry must be flat):');
    directories.forEach((dir) => {
      console.error(`      - ${dir.name}/`);
    });
    errors++;
  } else {
    console.log('   ✓ No nested directories (flat structure)');
  }

  console.log();
}

/**
 * Print summary
 */
function printSummary(itemCount) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Verification Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Items verified: ${itemCount}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  console.log();

  if (errors === 0 && warnings === 0) {
    console.log('✅ All checks passed!');
    console.log('🎯 Registry is compatible with registry index submission');
  } else if (errors === 0) {
    console.log('✅ No errors found');
    console.log(`⚠️  ${warnings} warning(s) - review recommended`);
  } else {
    console.log(`❌ ${errors} error(s) found - must be fixed before submission`);
    if (warnings > 0) {
      console.log(`⚠️  ${warnings} warning(s) - review recommended`);
    }
  }
  console.log();
}

/**
 * Main verification
 */
function verify() {
  const registry = verifyMainRegistry();
  if (!registry) {
    console.error('❌ Cannot continue without valid registry.json');
    process.exit(1);
  }

  // Verify each item
  for (const item of registry.items) {
    verifyRegistryItem(item);
  }

  // Verify flat structure (no nested directories)
  verifyFlatStructure();

  // Print summary
  printSummary(registry.items.length);

  // Exit with error code if there are errors
  if (errors > 0) {
    process.exit(1);
  }
}

// Run verification
try {
  verify();
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
