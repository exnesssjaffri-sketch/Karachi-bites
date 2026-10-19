(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const notice = $('#notice');
  function showNotice(message, isError = false) {
    notice.textContent = message;
    notice.classList.remove('hidden');
    notice.style.borderColor = isError ? '#B42318' : '#3A342E';
  }
  function setBusy(button, busy, label) {
    if (busy) { button.dataset.label = button.textContent; button.textContent = label; button.disabled = true; }
    else { button.textContent = button.dataset.label || button.textContent; button.disabled = false; }
  }
  function saveSession(session) {
    if (session && session.access_token) {
      sessionStorage.setItem('karachi_bites_customer_token', session.access_token);
      if (session.refresh_token) sessionStorage.setItem('karachi_bites_customer_refresh_token', session.refresh_token);
    }
  }
  function saveDisplayProfile(name, email, status) {
    sessionStorage.setItem('kb_account_display', JSON.stringify({ name, email, status }));
  }
  function redirectHome() { window.location.assign('/'); }
  async function showIdentity(session, fallbackName, fallbackEmail) {
    saveSession(session);
    if (!session || !session.access_token) return false;
    try {
      const response = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + session.access_token, Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        const userResponse = await fetch('https://rgejphvmnlwcoojkpcje.supabase.co/auth/v1/user', { headers: { apikey: 'sb_publishable_rdUChKjIijuU2b4Oc1UleQ_dQa_Kioh', Authorization: 'Bearer ' + session.access_token } });
        const authUser = userResponse.ok ? await userResponse.json() : {};
        const name = (authUser.user_metadata && authUser.user_metadata.full_name) || fallbackName || data.user.username || 'Customer';
        const email = authUser.email || fallbackEmail || data.user.email || '';
        saveDisplayProfile(name, email, 'signed-in');
        showNotice('Account created successfully! Welcome, ' + name + '. Taking you to the home page…');
        window.setTimeout(redirectHome, 1400);
        return true;
      } else showNotice('Account created, but the app could not confirm the profile yet. Apply the Supabase Auth migration and retry.', true);
    } catch (_) { showNotice('Account created, but the app could not confirm the profile because the server is unreachable.', true); }
    return false;
  }
  $('#emailSignInForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setBusy(button, true, 'Signing in…');
    try {
      const email = $('#email').value.trim();
      const session = await window.KBAuth.signInWithPassword(email, $('#password').value);
      $('#password').value = '';
      await showIdentity(session, '', email);
    } catch (error) { showNotice(error.message || 'Sign in failed.', true); }
    finally { setBusy(button, false); }
  });
  $('#signUpForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    setBusy(button, true, 'Creating account…');
    try {
      const fullName = $('#fullName').value.trim();
      const email = $('#newEmail').value.trim();
      const result = await window.KBAuth.signUpWithPassword(email, $('#newPassword').value, fullName);
      $('#newPassword').value = '';
      if (result.access_token) {
        await showIdentity(result, fullName, email);
      } else {
        saveDisplayProfile(fullName, email, 'pending-verification');
        showNotice('Account created successfully, ' + fullName + '! Please check your email to verify the account. Returning to the home page…');
        window.setTimeout(redirectHome, 2200);
      }
    } catch (error) { showNotice(error.message || 'Account creation failed.', true); }
    finally { setBusy(button, false); }
  });
  $('#sendOtpBtn').addEventListener('click', async () => {
    const phone = $('#phone').value.trim();
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) { showNotice('Enter a valid international phone number.', true); return; }
    const button = $('#sendOtpBtn'); setBusy(button, true, 'Sending OTP…');
    try {
      await window.KBAuth.sendPhoneOtp(phone, true);
      $('#otpPanel').classList.remove('hidden');
      showNotice('OTP request accepted. If SMS provider setup is incomplete, delivery will fail until Twilio is configured.');
    } catch (error) { showNotice(error.message || 'OTP could not be sent. Configure the phone provider first.', true); }
    finally { setBusy(button, false); }
  });
  $('#verifyOtpBtn').addEventListener('click', async () => {
    const phone = $('#phone').value.trim(), otp = $('#otp').value.trim();
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone) || !/^[0-9]{6}$/.test(otp)) { showNotice('Enter a valid phone number and 6-digit OTP.', true); return; }
    const button = $('#verifyOtpBtn'); setBusy(button, true, 'Verifying…');
    try {
      const session = await window.KBAuth.verifyPhoneOtp(phone, otp);
      await showIdentity(session); $('#otp').value = '';
    } catch (error) { showNotice(error.message || 'OTP verification failed.', true); }
    finally { setBusy(button, false); }
  });
})();
