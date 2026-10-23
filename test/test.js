const { execSync } = require('child_process');
const path = require('path');

const testDir = __dirname;
const files = [
  'test_db.js',
  'test_api.js',
  'test_failures.js',
  'test_persistence.js',
  'test_admin_menu.js',
  'test_csv_export.js',
  'test_frontend_wiring.js',
  'test_cart_store.js',
  'test_cart_total_property.js',
  'test_account_google_mobile.js',
  'test_live_translation_performance.js',
  'test_mobile_header_translation.js',
  'test_mobile_responsive_layout.js',
];

let allPassed = true;

for (const file of files) {
  const filePath = path.join(testDir, file);
  console.log('\n=== Running ' + file + ' ===\n');
  try {
    execSync('"' + process.execPath + '" "' + filePath + '"', {
      stdio: 'inherit',
      cwd: path.join(testDir, '..'),
    });
    console.log('\n=== ' + file + ' PASSED ===\n');
  } catch (err) {
    allPassed = false;
    console.error('\n=== ' + file + ' FAILED ===\n');
  }
}

if (!allPassed) {
  console.error('Some tests failed.');
  process.exit(1);
} else {
  console.log('All test suites passed.');
  process.exit(0);
}
