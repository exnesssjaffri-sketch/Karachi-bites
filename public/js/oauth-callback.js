(() => {
  'use strict';
  const status = document.getElementById('status');
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const errorDescription = params.get('error_description') || params.get('error');
  if (errorDescription) {
    status.textContent = 'Google sign-in was not completed. ' + errorDescription;
    return;
  }
  if (!accessToken) {
    status.textContent = 'No sign-in token was returned. Please go back and try again.';
    return;
  }
  sessionStorage.setItem('karachi_bites_customer_token', accessToken);
  if (refreshToken) sessionStorage.setItem('karachi_bites_customer_refresh_token', refreshToken);
  fetch('https://rgejphvmnlwcoojkpcje.supabase.co/auth/v1/user', {
    headers: {
      apikey: 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh',
      Authorization: 'Bearer ' + accessToken,
    },
  }).then(async (response) => {
    if (!response.ok) throw new Error('Could not load the Google account profile.');
    const user = await response.json();
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
