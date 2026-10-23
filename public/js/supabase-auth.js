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

  async function signInWithGoogle() {
    const random = new Uint8Array(48);
    crypto.getRandomValues(random);
    const verifier = Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '');
    sessionStorage.setItem('kb_oauth_code_verifier', verifier);
    const redirectTo = window.location.origin + '/auth-callback.html';
    const params = new URLSearchParams({
      provider: 'google',
      redirect_to: redirectTo,
      code_challenge: challenge,
      code_challenge_method: 's256',
    });
    window.location.assign(SUPABASE_URL + '/auth/v1/authorize?' + params.toString());
  }

  function refreshSession(refresh_token) {
    return authRequest('/auth/v1/token?grant_type=refresh_token', { refresh_token });
  }

  window.KBAuth = { signUpWithPassword, signInWithPassword, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, refreshSession };
})();
