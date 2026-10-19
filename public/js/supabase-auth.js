(() => {
  'use strict';

  // Publishable/anon keys are designed for browser use. Never put a service-role key here.
  const SUPABASE_URL = 'https://rgejphvmnlwcoojkpcje.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh';

  async function authRequest(path, body) {
    const response = await fetch(SUPABASE_URL + path, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = result.msg || result.message || result.error_description || result.error || 'Authentication request failed.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return result;
  }

  function signUpWithPassword(email, password, fullName) {
    return authRequest('/auth/v1/signup', { email, password, data: { full_name: fullName } });
  }

  function signInWithPassword(email, password) {
    return authRequest('/auth/v1/token?grant_type=password', { email, password });
  }

  function sendPhoneOtp(phone, shouldCreateUser = false) {
    return authRequest('/auth/v1/otp', { phone, create_user: shouldCreateUser });
  }

  function verifyPhoneOtp(phone, token) {
    return authRequest('/auth/v1/verify', { phone, token, type: 'sms' });
  }

  function refreshSession(refresh_token) {
    return authRequest('/auth/v1/token?grant_type=refresh_token', { refresh_token });
  }

  window.KBAuth = { signUpWithPassword, signInWithPassword, sendPhoneOtp, verifyPhoneOtp, refreshSession };
})();
