(() => {
  'use strict';
  const status = document.getElementById('status');
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const errorDescription = params.get('error_description') || params.get('error');
  if (errorDescription) {
    status.textContent = 'Google sign-in was not completed. ' + errorDescription;
    return;
  }
  const verifier = sessionStorage.getItem('kb_oauth_code_verifier');
  if (!code || !verifier) {
    status.textContent = 'No valid sign-in code was returned. Please go back and try again.';
    return;
  }
  sessionStorage.removeItem('kb_oauth_code_verifier');
  fetch('https://rgejphvmnlwcoojkpcje.supabase.co/auth/v1/token?grant_type=pkce', {
    method: 'POST',
    headers: { apikey: 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh', 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  }).then(async (response) => {
    if (!response.ok) throw new Error('Google sign-in code could not be verified.');
    const session = await response.json();
    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;
    if (!accessToken) throw new Error('No access token was returned.');
    sessionStorage.setItem('karachi_bites_customer_token', accessToken);
    if (refreshToken) sessionStorage.setItem('karachi_bites_customer_refresh_token', refreshToken);
    const userResponse = await fetch('https://rgejphvmnlwcoojkpcje.supabase.co/auth/v1/user', {
      headers: {
        apikey: 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh',
        Authorization: 'Bearer ' + accessToken,
      },
    });
    if (!userResponse.ok) throw new Error('Could not load the Google account profile.');
    const user = await userResponse.json();
    return { user, accessToken };
  }).then(async ({user, accessToken}) => {
    if (!response.ok) throw new Error('Could not load the Google account profile.');
    const metadata = user.user_metadata || {};
    const profile = {
      name: metadata.full_name || metadata.name || user.email || 'Customer',
      email: user.email || '',
      avatar_url: metadata.avatar_url || metadata.picture || '',
      status: 'signed-in',
    };
    sessionStorage.setItem('kb_account_display', JSON.stringify(profile));
    window.history.replaceState({}, document.title, '/auth-callback.html');
    window.location.replace('/');
  }).catch((error) => {
    sessionStorage.removeItem('karachi_bites_customer_token');
    sessionStorage.removeItem('karachi_bites_customer_refresh_token');
    status.textContent = error.message || 'Google sign-in failed. Please try again.';
  });
})();
