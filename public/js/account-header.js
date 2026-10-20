(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const summary = $('#kb-account-summary');
  const loginLink = $('#kb-account-login');
  if (!summary) return;

  function renderProfile(profile) {
    if (!profile || (!profile.name && !profile.email)) return;
    $('#kb-account-name').textContent = profile.name || 'Customer';
    $('#kb-account-email').textContent = profile.email || '';
    const status = $('#kb-account-status');
    if (profile.status === 'pending-verification') {
      status.textContent = 'Verify your email';
      status.style.color = '#E6B566';
    } else {
      status.textContent = 'Account';
      status.style.color = '#B8B0A6';
    }
    summary.classList.remove('hidden');
    summary.classList.add('inline-flex');
    if (loginLink) loginLink.classList.add('hidden');
  }

  async function loadAccount() {
    let cached = null;
    try {
      cached = JSON.parse(sessionStorage.getItem('kb_account_display') || 'null');
    } catch (_) {}
    const token = sessionStorage.getItem('karachi_bites_customer_token');

    if (token) {
      try {
        const response = await fetch('https://rgejphvmnlwcoojkpcje.supabase.co/auth/v1/user', {
          headers: {
            apikey: 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh',
            Authorization: 'Bearer ' + token,
          },
        });
        if (response.ok) {
          const user = await response.json();
          const name = (user.user_metadata && user.user_metadata.full_name) || (cached && cached.name) || user.email || 'Customer';
          const profile = { name, email: user.email || (cached && cached.email) || '', status: 'signed-in' };
          sessionStorage.setItem('kb_account_display', JSON.stringify(profile));
          renderProfile(profile);
          return;
        }
        sessionStorage.removeItem('karachi_bites_customer_token');
        sessionStorage.removeItem('karachi_bites_customer_refresh_token');
      } catch (_) {
        // Keep the locally cached display name if the auth service is temporarily unavailable.
      }
    }
    if (cached) renderProfile(cached);
  }

  loadAccount();
})();
