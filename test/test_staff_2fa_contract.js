const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.join(__dirname, '..', 'supabase', 'functions', 'karachi-bites-api', 'index.ts');
const source = fs.readFileSync(sourcePath, 'utf8');

const required = [
  'route === "/auth/register"',
  'route === "/auth/enroll"',
  'route === "/auth/login"',
  'route === "/auth/send-otp"',
  'route === "/auth/verify-otp"',
  'route === "/auth/logout"',
  'function rateAllowed(',
  'increment_auth_challenge_attempts',
  'code_expires_at',
  'consumed_at',
  'email_verified',
  'sendEmailOtp',
  'sendSmsOtp',
];

for (const marker of required) {
  assert.ok(source.includes(marker), 'Missing required 2FA contract marker: ' + marker);
}

const loginStart = source.indexOf('if (req.method === "POST" && route === "/auth/login")');
const sendStart = source.indexOf('if (req.method === "POST" && route === "/auth/send-otp")', loginStart);
assert.ok(loginStart >= 0 && sendStart > loginStart, 'Login route must exist before OTP delivery route');
const loginBlock = source.slice(loginStart, sendStart);
assert.ok(loginBlock.includes('createChallenge(user.id, "login")'), 'Password login must create a pending OTP challenge');
assert.ok(!loginBlock.includes('admin_sessions').includes('insert'), 'Password login must not issue a session directly');

const verifyStart = source.indexOf('if (req.method === "POST" && route === "/auth/verify-otp")');
const logoutStart = source.indexOf('if (req.method === "POST" && route === "/auth/logout")', verifyStart);
assert.ok(verifyStart >= 0 && logoutStart > verifyStart, 'OTP verification route must exist');
const verifyBlock = source.slice(verifyStart, logoutStart);
assert.ok(verifyBlock.includes('code_expires_at'), 'OTP expiry must be checked');
assert.ok(verifyBlock.includes('consumed_at'), 'OTP must be single-use');
assert.ok(verifyBlock.includes('admin_sessions').includes('insert'), 'A session may only be created after OTP verification');

console.log('Staff 2FA source contract checks passed.');
