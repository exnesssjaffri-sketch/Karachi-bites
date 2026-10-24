(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const summary = $('#kb-account-summary');
  const loginLink = $('#kb-account-login');
  const avatar = $('#kb-account-avatar');
  const defaultIcon = $('#kb-account-default-icon');

  function renderProfile(profile) {
    if (!profile || (!profile.name && !profile.email)) return;
    const name = profile.name || 'Customer';
    if ($('#kb-account-name')) $('#kb-account-name').textContent = name;
    if ($('#kb-account-email')) $('#kb-account-email').textContent = profile.email || '';
    const status = $('#kb-account-status');
    if (status) {
      status.textContent = profile.status === 'pending-verification' ? 'Verify your email' : 'Account';
      status.style.color = profile.status === 'pending-verification' ? '#E6B566' : '#B8B0A6';
    }
    if (summary) { summary.classList.remove('hidden'); summary.classList.add('inline-flex'); }
    if (loginLink) {
      loginLink.setAttribute('aria-label', 'Open account for ' + name);
      loginLink.title = name;
      if (profile.avatar_url && avatar) {
        avatar.src = profile.avatar_url;
        avatar.classList.remove('hidden');
        if (defaultIcon) defaultIcon.classList.add('hidden');
        avatar.onerror = () => { avatar.classList.add('hidden'); if (defaultIcon) defaultIcon.classList.remove('hidden'); };
      } else if (avatar) {
        avatar.classList.add('hidden');
        if (defaultIcon) defaultIcon.classList.remove('hidden');
      }
    }
  }

  async function loadAccount() {
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('kb_account_display') || 'null'); } catch (_) {}
    const token = sessionStorage.getItem('karachi_bites_customer_token');
    if (token) {
      try {
        const response = await fetch('https://rgejphvmnlwcoojkpcje.supabase.co/auth/v1/user', {
          headers: { apikey: 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh', Authorization: 'Bearer ' + token },
        });
        if (response.ok) {
          const user = await response.json();
          const profile = {
            name: (user.user_metadata && user.user_metadata.full_name) || (cached && cached.name) || user.email || 'Customer',
            email: user.email || (cached && cached.email) || '',
            avatar_url: user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture) || (cached && cached.avatar_url) || '',
            status: 'signed-in',
          };
          sessionStorage.setItem('kb_account_display', JSON.stringify(profile));
          renderProfile(profile);
          return;
        }
        sessionStorage.removeItem('karachi_bites_customer_token');
        sessionStorage.removeItem('karachi_bites_customer_refresh_token');
      } catch (_) {}
    }
    if (cached) renderProfile(cached);
  }
  loadAccount();
})();
