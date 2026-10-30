(() => {
  'use strict';

  const TOKEN_KEY = 'karachi_bites_admin_token';
  const REFRESH_TOKEN_KEY = 'karachi_bites_admin_refresh_token';
  const API_BASE_URL = '';
  const $ = (selector) => document.querySelector(selector);
  const loginPanel = $('#loginPanel');
  const dashboardPanel = $('#dashboardPanel');
  const otpPanel = $('#otpPanel');
  const otpForm = $('#otpForm');
  const verifyOtpBtn = $('#verifyOtpBtn');
  let pendingPreAuthToken = null;
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');
  const enrollForm = $('#enrollForm');
  const otpMethods = $('#otpMethods');
  const otpInstructions = $('#otpInstructions');
  let pendingChallengeId = null;
  let pendingPurpose = null;
  let pendingMethods = [];
  let selectedMethod = null;
  let pendingUsername = '';
  const loginBtn = $('#loginBtn');
  const logoutBtn = $('#logoutBtn');
  const notice = $('#notice');
  const ordersBody = $('#ordersBody');
  const refreshBtn = $('#refreshBtn');
  const filters = $('#filters');
  const branchFilter = $('#branchFilter');
  const dateFilter = $('#dateFilter');
  const kitchenModal = $('#kitchenTicketModal');
  const closeKitchenBtn = $('#closeKitchenBtn');
  const printKitchenBtn = $('#printKitchenBtn');
  const kitchenTicketTitle = $('#kitchenTicketTitle');
  const kitchenTicketBody = $('#kitchenTicketBody');
  const transitions = {
    'Received': ['Preparing'],
    'Preparing': ['Out for Delivery'],
    'Out for Delivery': ['Delivered'],
    'Delivered': []
  };

  // Language toggle button in the admin header
  const langToggleBtnAdmin = $('#lang-toggle-admin');
  if (langToggleBtnAdmin) {
    langToggleBtnAdmin.addEventListener('click', () => {
      const next = getCurrentLanguage() === 'en' ? 'ur' : 'en';
      setLanguage(next);
    });
  }

  function showNotice(message, isError = false) {
    notice.textContent = message;
    notice.classList.remove('hidden', 'text-rose-300', 'text-emerald-300');
    notice.classList.add(isError ? 'text-rose-300' : 'text-emerald-300');
  }

  function clearNotice() {
    notice.textContent = '';
    notice.classList.add('hidden');
    notice.classList.remove('text-rose-300', 'text-emerald-300');
  }

  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
      button.classList.add('opacity-60', 'cursor-not-allowed');
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      button.classList.remove('opacity-60', 'cursor-not-allowed');
    }
  }

  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
  }

  function saveToken(token) {
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch (_) {}
  }

  function clearToken() {
    try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(REFRESH_TOKEN_KEY); } catch (_) {}
  }

  function setAuthStage(stage) {
    loginPanel.classList.remove('hidden');
    [loginForm, registerForm, enrollForm, otpPanel].forEach((element) => element && element.classList.add('hidden'));
    if (stage === 'login') loginForm && loginForm.classList.remove('hidden');
    if (stage === 'register') registerForm && registerForm.classList.remove('hidden');
    if (stage === 'enroll') enrollForm && enrollForm.classList.remove('hidden');
    if (stage === 'otp') otpPanel && otpPanel.classList.remove('hidden');
  }

  function showLogin() {
    setAuthStage('login');
    dashboardPanel.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }

  function showDashboard() {
    loginPanel.classList.add('hidden');
    otpPanel.classList.add('hidden');
    dashboardPanel.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  }

  async function requestJson(url, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (options.body) headers.set('Content-Type', 'application/json');

    let response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    if (response.status === 401 && window.KBAuth && sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
      try {
        const refreshed = await window.KBAuth.refreshSession(sessionStorage.getItem(REFRESH_TOKEN_KEY));
        if (refreshed.access_token) {
          saveToken(refreshed.access_token);
          if (refreshed.refresh_token) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refresh_token);
          headers.set('Authorization', 'Bearer ' + refreshed.access_token);
          response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
        }
      } catch (_) { clearToken(); }
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || ('Request failed (' + response.status + ')'));
      error.status = response.status;
      throw error;
    }
    return body;
  }

  function clearPendingChallenge() {
    pendingChallengeId = null;
    pendingPurpose = null;
    pendingMethods = [];
    selectedMethod = null;
    otpMethods.replaceChildren();
    otpForm.classList.add('hidden');
    $('#otpCode').value = '';
  }

  function showOtpStage(challenge, alreadySent = false) {
    pendingChallengeId = challenge.challengeId;
    pendingPurpose = challenge.purpose;
    pendingMethods = Array.isArray(challenge.methods) ? challenge.methods : [];
    selectedMethod = alreadySent ? 'email' : null;
    otpInstructions.textContent = challenge.purpose === 'register' || challenge.purpose === 'enroll'
      ? 'Enter the code sent to ' + (challenge.maskedEmail || 'your registered email') + '.'
      : 'Choose where to receive your one-time code.';
    otpMethods.replaceChildren();
    otpMethods.classList.toggle('hidden', alreadySent);
    pendingMethods.forEach((method) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-muted w-full';
      button.textContent = method === 'email'
        ? 'Send code to email ' + (challenge.maskedEmail || '')
        : 'Send SMS ' + (challenge.maskedPhone || '');
      button.addEventListener('click', () => sendOtp(method));
      otpMethods.appendChild(button);
    });
    if (!alreadySent && !pendingMethods.includes('sms')) {
      const smsUnavailable = document.createElement('button');
      smsUnavailable.type = 'button';
      smsUnavailable.disabled = true;
      smsUnavailable.className = 'btn btn-muted w-full opacity-60 cursor-not-allowed';
      smsUnavailable.textContent = 'SMS unavailable — provider not configured';
      otpMethods.appendChild(smsUnavailable);
    }
    if (!alreadySent && !pendingMethods.includes('email')) {
      const emailUnavailable = document.createElement('button');
      emailUnavailable.type = 'button';
      emailUnavailable.disabled = true;
      emailUnavailable.className = 'btn btn-muted w-full opacity-60 cursor-not-allowed';
      emailUnavailable.textContent = 'Email unavailable — administrator setup required';
      otpMethods.appendChild(emailUnavailable);
    }
    if (!pendingMethods.length) {
      otpInstructions.textContent = 'No verification delivery method is configured. The site administrator must configure Resend email delivery; SMS also requires an SMS provider.';
    }
    otpForm.classList.toggle('hidden', !alreadySent);
    setAuthStage('otp');
  }

  async function sendOtp(method) {
    if (!pendingChallengeId) return;
    clearNotice();
    const buttons = Array.from(otpMethods.querySelectorAll('button'));
    buttons.forEach((button) => { button.disabled = true; });
    try {
      await requestJson('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ challengeId: pendingChallengeId, method })
      });
      selectedMethod = method;
      otpMethods.classList.add('hidden');
      otpInstructions.textContent = method === 'email'
        ? 'Enter the six-digit code sent to your email. It expires in 5 minutes.'
        : 'Enter the six-digit SMS code. It expires in 5 minutes.';
      otpForm.classList.remove('hidden');
      $('#otpCode').focus();
      showNotice('Verification code sent.');
    } catch (error) {
      showNotice(error.message || 'Could not send verification code.', true);
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  async function login(event) {
    event.preventDefault();
    clearNotice();
    setBusy(loginBtn, true, 'Checking…');
    try {
      const username = $('#username').value.trim();
      const password = $('#password').value;
      pendingUsername = username;
      const response = await requestJson('/auth/login', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ username, password })
      });
      $('#password').value = '';
      if (response.requiresOtp === true && typeof response.preAuthToken === 'string') {
        pendingPreAuthToken = response.preAuthToken;
        const otpDesc = $('#otpDescription');
        if (otpDesc) {
          otpDesc.textContent = 'A verification code was sent to ' + (response.maskedDestination || 'your registered email') + '. It expires in 5 minutes.';
        }
        setAuthStage('otp');
        $('#otpCode').value = '';
        $('#otpCode').focus();
        showNotice('Verification code sent. Check your inbox and spam folder.');
        return;
      }
      if (response.enrollmentRequired) {
        $('#enrollUsername').value = username;
        $('#enrollPassword').value = '';
        setAuthStage('enroll');
        showNotice('This account needs email and phone setup before two-factor sign-in can be enabled.');
        return;
      }
      if (response.challengeId) {
        showOtpStage(response, false);
        return;
      }
      if (!response.token) throw new Error('The login API did not return a token.');
      clearToken();
      saveToken(response.token);
      await loadOrders();
    } catch (error) {
      clearToken();
      showLogin();
      showNotice(error.status === 401
        ? 'Username or password is incorrect.'
        : (error.message || 'Unable to sign in.'), true);
    } finally {
      setBusy(loginBtn, false);
    }
  }

  async function emailAuthLogin(event) {
    event.preventDefault();
    clearNotice();
    setBusy($('#emailAuthBtn'), true, 'Signing in…');
    try {
      const email = $('#authEmail').value.trim();
      const password = $('#authPassword').value;
      const response = await window.KBAuth.signInWithPassword(email, password);
      if (!response.access_token) throw new Error('Supabase did not return a session. Confirm your email if prompted.');
      saveToken(response.access_token);
      if (response.refresh_token) sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      $('#authPassword').value = '';
      await loadOrders();
    } catch (error) {
      clearToken();
      showLogin();
      showNotice(error.message || 'Unable to sign in with email.', true);
    } finally {
      setBusy($('#emailAuthBtn'), false);
    }
  }

  async function sendStaffOtp() {
    clearNotice();
    const phone = $('#authPhone').value.trim();
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) {
      showNotice('Enter the phone number in international format, for example +923001234567.', true);
      return;
    }
    setBusy($('#sendOtpBtn'), true, 'Sending OTP…');
    try {
      await window.KBAuth.sendPhoneOtp(phone, false);
      $('#otpEntry').classList.remove('hidden');
      showNotice('If this phone belongs to an existing Auth account and SMS is configured, an OTP has been sent.');
    } catch (error) {
      showNotice(error.message || 'Could not send the OTP. The SMS provider may not be configured yet.', true);
    } finally {
      setBusy($('#sendOtpBtn'), false);
    }
  }

  async function verifyStaffOtp() {
    clearNotice();
    const phone = $('#authPhone').value.trim();
    const otp = $('#authOtp').value.trim();
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone) || !/^[0-9]{6}$/.test(otp)) {
      showNotice('Enter a valid international phone number and the 6-digit OTP.', true);
      return;
    }
    setBusy($('#verifyOtpBtn'), true, 'Verifying…');
    try {
      const response = await window.KBAuth.verifyPhoneOtp(phone, otp);
      if (!response.access_token) throw new Error('Supabase did not return a session.');
      saveToken(response.access_token);
      if (response.refresh_token) sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      $('#authOtp').value = '';
      await loadOrders();
    } catch (error) {
      clearToken();
      showLogin();
      showNotice(error.message || 'OTP verification failed.', true);
    } finally {
      setBusy($('#verifyOtpBtn'), false);
    }
  }

  async function register(event) {
    event.preventDefault();
    clearNotice();
    const button = $('#registerBtn');
    setBusy(button, true, 'Creating account…');
    try {
      pendingUsername = $('#registerUsername').value.trim();
      const response = await requestJson('/auth/register', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({
          username: pendingUsername,
          password: $('#registerPassword').value,
          email: $('#registerEmail').value.trim(),
          phone: $('#registerPhone').value.trim()
        })
      });
      $('#registerPassword').value = '';
      showOtpStage(response, true);
      showNotice('Account created. Enter the email code to verify it.');
    } catch (error) {
      showNotice(error.message || 'Could not create the staff ID.', true);
    } finally {
      setBusy(button, false);
    }
  }

  async function enroll(event) {
    event.preventDefault();
    clearNotice();
    const button = $('#enrollBtn');
    setBusy(button, true, 'Sending verification…');
    try {
      pendingUsername = $('#enrollUsername').value.trim();
      const response = await requestJson('/auth/enroll', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({
          username: pendingUsername,
          password: $('#enrollPassword').value,
          email: $('#enrollEmail').value.trim(),
          phone: $('#enrollPhone').value.trim()
        })
      });
      $('#enrollPassword').value = '';
      showOtpStage(response, true);
      showNotice('A verification code has been sent to your email.');
    } catch (error) {
      showNotice(error.message || 'Could not secure this account.', true);
    } finally {
      setBusy(button, false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    clearNotice();
    const button = $('#verifyOtpBtn');
    setBusy(button, true, 'Verifying…');
    try {
      const response = await requestJson('/auth/verify-otp', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ challengeId: pendingChallengeId, code: $('#otpCode').value.trim() })
      });
      if (response.token) {
        saveToken(response.token);
        clearPendingChallenge();
        $('#password').value = '';
        await loadOrders();
        showNotice('Identity verified. Staff portal unlocked.');
        return;
      }
      if (response.accountReady) {
        clearPendingChallenge();
        showLogin();
        $('#username').value = pendingUsername;
        showNotice('Email verified. Sign in with your username and password.');
        return;
      }
      throw new Error('Verification completed without a valid session.');
    } catch (error) {
      showNotice(error.message || 'The code could not be verified.', true);
    } finally {
      setBusy(button, false);
    }
  }

  async function resendOtp() {
    if (!pendingChallengeId || !selectedMethod) {
      showNotice('Choose email or SMS first.', true);
      return;
    }
    await sendOtp(selectedMethod);
  }

  function makeCell(value) {
    const cell = document.createElement('td');
    cell.textContent = value == null || value === '' ? '—' : String(value);
    return cell;
  }

  function formatDate(value) {
    if (!value) return '—';
    const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }

  function makeKitchenTicketLink(order) {
    const link = document.createElement('a');
    link.href = '/kitchen-ticket.html?order=' + encodeURIComponent(order.orderId || '');
    link.className = 'btn btn-muted text-xs inline-flex items-center justify-center mt-2';
    link.textContent = 'Print ticket';
    link.setAttribute('aria-label', 'Print kitchen ticket for ' + (order.orderId || 'order'));
    return link;
  }

  function emptyTable(message) {
    ordersBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'text-[#B8B0A6]';
    cell.textContent = message;
    row.appendChild(cell);
    ordersBody.appendChild(row);
  }

  function makeActionCell(order) {
    const cell = document.createElement('td');
    const available = transitions[order.status] || [];
    if (!available.length) {
      const complete = document.createElement('span');
      complete.className = 'status';
      complete.textContent = 'Complete';
      const kitchenBtn = document.createElement('button');
      kitchenBtn.type = 'button';
      kitchenBtn.className = 'btn btn-muted text-xs ml-2';
      kitchenBtn.textContent = 'Kitchen Ticket';
      kitchenBtn.addEventListener('click', () => openKitchenTicket(order.orderId));
      cell.appendChild(complete);
      cell.appendChild(kitchenBtn);
      return cell;
    }

    const form = document.createElement('form');
    form.className = 'flex items-center gap-2';
    const select = document.createElement('select');
    select.className = 'field min-w-[150px]';
    select.setAttribute('aria-label', 'Next status for ' + (order.orderId || 'order'));

    available.forEach((status) => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      select.appendChild(option);
    });

    const button = document.createElement('button');
    button.className = 'btn btn-primary text-xs';
    button.type = 'submit';
    button.textContent = 'Update';
    form.append(select, button);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setBusy(button, true, 'Saving…');
      try {
        await requestJson('/api/admin/orders/' + encodeURIComponent(order.orderId) + '/status', {
          method: 'PATCH',
          body: JSON.stringify({ status: select.value })
        });
        showNotice('Order ' + order.orderId + ' updated to ' + select.value + '.');
        await loadOrders();
      } catch (error) {
        if (error.status === 401 || error.status === 403) {
          clearToken();
          showLogin();
        }
        showNotice(error.message || 'Could not update the order.', true);
      } finally {
        setBusy(button, false);
      }
    });

    const kitchenBtn = document.createElement('button');
    kitchenBtn.type = 'button';
    kitchenBtn.className = 'btn btn-muted text-xs ml-2';
    kitchenBtn.textContent = 'Kitchen Ticket';
    kitchenBtn.addEventListener('click', () => openKitchenTicket(order.orderId));

    cell.appendChild(form);
cell.appendChild(kitchenBtn);
    return cell;
  }

  function openKitchenTicket(orderId) {
    kitchenTicketTitle.textContent = `Kitchen Ticket — ${orderId}`;
    kitchenTicketBody.innerHTML = '<div class="text-center text-[#B8B0A6]">Loading kitchen ticket...</div>';
    kitchenModal.classList.remove('hidden');

    requestJson(`/api/admin/kitchen/${encodeURIComponent(orderId)}`)
      .then((ticket) => {
        renderKitchenTicket(ticket);
      })
      .catch((error) => {
        kitchenTicketBody.innerHTML = `<div class="text-center text-rose-400">Failed to load kitchen ticket: ${error.message}</div>`;
      });
  }

  function renderKitchenTicket(ticket) {
    const items = ticket.items || [];
    const customer = ticket.customer || {};
    const summary = ticket.summary || {};

    kitchenTicketBody.innerHTML = `
      <div class="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-[#3A342E]">
        <div>
          <p class="text-xs text-[#B8B0A6] uppercase tracking-wide">Order ID</p>
          <p class="font-semibold text-[#F7F3EC]">${ticket.orderId || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-[#B8B0A6] uppercase tracking-wide">Customer</p>
          <p class="font-semibold text-[#F7F3EC]">${customer.name || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-[#B8B0A6] uppercase tracking-wide">Phone</p>
          <p class="font-semibold text-[#F7F3EC]">${customer.phone || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-[#B8B0A6] uppercase tracking-wide">Branch</p>
          <p class="font-semibold text-[#F7F3EC]">${ticket.branch || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-[#B8B0A6] uppercase tracking-wide">Placed</p>
          <p class="font-semibold text-[#F7F3EC]">${formatDate(ticket.createdAt)}</p>
        </div>
        <div>
          <p class="text-xs text-[#B8B0A6] uppercase tracking-wide">Status</p>
          <p class="font-semibold text-[#F7F3EC]">${ticket.status || '—'}</p>
        </div>
      </div>

      ${ticket.specialInstructions ? `
        <div class="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p class="text-xs text-amber-400 uppercase tracking-wide mb-1">Special Instructions</p>
          <p class="text-amber-200 text-sm">${ticket.specialInstructions}</p>
        </div>
      ` : ''}

      <h3 class="font-semibold text-[#F7F3EC] mb-3">Order Items</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-[#B8B0A6] uppercase tracking-wide">
            <th class="pb-2">Item</th>
            <th class="pb-2 text-right">Qty</th>
            <th class="pb-2 text-right">Price</th>
            <th class="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr class="border-t border-[#3A342E]">
              <td class="py-2 text-[#F7F3EC]">${item.name || '—'}</td>
              <td class="py-2 text-right text-[#B8B0A6]">${item.quantity || 0}</td>
              <td class="py-2 text-right text-[#B8B0A6]">${cartStore ? cartStore.formatPrice(item.price) : 'Rs. ' + Number(item.price).toLocaleString('en-PK')}</td>
              <td class="py-2 text-right text-[#F7F3EC]">${cartStore ? cartStore.formatPrice(item.price * (item.quantity || 0)) : 'Rs. ' + Number(item.price * (item.quantity || 0)).toLocaleString('en-PK')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="border-t border-[#3A342E]">
            <td colspan="2" class="py-3 text-right font-semibold text-[#F7F3EC]">Total</td>
            <td class="py-3 text-right text-[#B42318] font-price text-lg">${cartStore ? cartStore.formatPrice(summary.total || 0) : 'Rs. ' + Number(summary.total || 0).toLocaleString('en-PK')}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  function renderOrders(orders) {
    ordersBody.replaceChildren();
    const list = Array.isArray(orders) ? orders : [];
    $('#orderCount').textContent = String(list.length);
    $('#receivedCount').textContent = String(list.filter((o) => o.status === 'Received').length);
    $('#preparingCount').textContent = String(list.filter((o) => o.status === 'Preparing').length);
    $('#deliveryCount').textContent = String(list.filter((o) => o.status === 'Out for Delivery').length);

    if (!list.length) {
      emptyTable('No orders match these filters.');
      return;
    }

    list.forEach((order) => {
      const row = document.createElement('tr');
      const orderCell = document.createElement('td');
      const orderId = document.createElement('div');
      orderId.className = 'font-semibold text-[#F7F3EC]';
      orderId.textContent = order.orderId || 'Unknown ID';
      const created = document.createElement('div');
      created.className = 'mt-1 text-xs text-[#B8B0A6]';
      created.textContent = formatDate(order.createdAt);
      orderCell.append(orderId, created);

      const customerCell = document.createElement('td');
      const customerName = document.createElement('div');
      customerName.className = 'font-medium';
      customerName.textContent = order.customer?.name || '—';
      const customerPhone = document.createElement('div');
      customerPhone.className = 'mt-1 text-xs text-[#B8B0A6]';
      customerPhone.textContent = order.customer?.phone || '—';
      const customerAddress = document.createElement('div');
      customerAddress.className = 'mt-1 max-w-xs whitespace-normal text-xs text-[#B8B0A6]';
      customerAddress.textContent = order.customer?.address || '—';
      customerCell.append(customerName, customerPhone, customerAddress);

      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = 'status';
      statusBadge.textContent = order.status || 'Unknown';
      statusCell.appendChild(statusBadge);

      row.append(
        orderCell,
        customerCell,
        makeCell(order.branch),
        makeCell(Number.isFinite(Number(order.total)) ? 'Rs. ' + Number(order.total).toLocaleString('en-PK') : order.total),
        statusCell,
        makeActionCell(order)
      );
      ordersBody.appendChild(row);
    });
  }

  async function loadOrders() {
    const token = getToken();
    if (!token) {
      showLogin();
      return;
    }

    clearNotice();
    showDashboard();
    setBusy(refreshBtn, true, 'Loading…');
    emptyTable('Loading orders…');
    try {
      const params = new URLSearchParams();
      if (branchFilter.value) params.set('branch', branchFilter.value);
      if (dateFilter.value) params.set('date', dateFilter.value);
      const query = params.toString();
      const orders = await requestJson('/api/admin/orders' + (query ? '?' + query : ''));
      renderOrders(orders);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearToken();
        showLogin();
        emptyTable('Sign in with a verified staff account to view orders.');
        showNotice(error.status === 403
          ? 'This account is not authorized to manage staff orders.'
          : 'Your session has expired. Please sign in again.', true);
        return;
      }
      emptyTable('Orders could not be loaded.');
      showNotice(error.message || 'Unable to load orders.', true);
    } finally {
      setBusy(refreshBtn, false);
    }
  }

  otpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pendingPreAuthToken) {
      showLogin();
      showNotice('Your verification attempt expired. Please sign in again.', true);
      return;
    }
    clearNotice();
    setBusy(verifyOtpBtn, true, 'Verifying…');
    try {
      const result = await requestJson('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ preAuthToken: pendingPreAuthToken, code: $('#otpCode').value.trim() })
      });
      if (!result.token) throw new Error('The verification API did not return a session.');
      pendingPreAuthToken = null;
      saveToken(result.token);
      await loadOrders();
    } catch (error) {
      showNotice(error.message || 'Verification failed. Check the code and try again.', true);
    } finally {
      setBusy(verifyOtpBtn, false);
    }
  });
  $('#backToLoginBtn').addEventListener('click', () => {
    pendingPreAuthToken = null;
    $('#otpCode').value = '';
    showLogin();
    clearNotice();
  });
  loginForm.addEventListener('submit', login);
  $('#emailAuthForm').addEventListener('submit', emailAuthLogin);
  $('#sendOtpBtn').addEventListener('click', sendStaffOtp);
  $('#verifyOtpBtn').addEventListener('click', verifyStaffOtp);
  registerForm.addEventListener('submit', register);
  enrollForm.addEventListener('submit', enroll);
  otpForm.addEventListener('submit', verifyOtp);
  $('#showRegisterBtn').addEventListener('click', () => { clearNotice(); setAuthStage('register'); });
  $('#showEnrollBtn').addEventListener('click', () => { clearNotice(); setAuthStage('enroll'); });
  $('#backToLoginFromRegister').addEventListener('click', () => { clearNotice(); showLogin(); });
  $('#backToLoginFromEnroll').addEventListener('click', () => { clearNotice(); showLogin(); });
  $('#cancelOtpBtn').addEventListener('click', () => { clearPendingChallenge(); showLogin(); clearNotice(); });
  $('#resendOtpBtn').addEventListener('click', resendOtp);
  logoutBtn.addEventListener('click', async () => {
    try { await requestJson('/auth/logout', { method: 'POST' }); } catch (_) {}
    clearToken();
    clearPendingChallenge();
    pendingPreAuthToken = null;
    showLogin();
    clearNotice();
    emptyTable('Sign in to load orders.');
  });
  refreshBtn.addEventListener('click', loadOrders);
  filters.addEventListener('submit', (event) => {
    event.preventDefault();
    loadOrders();
  });

  closeKitchenBtn.addEventListener('click', () => {
    kitchenModal.classList.add('hidden');
  });
  kitchenModal.addEventListener('click', (event) => {
    if (event.target === kitchenModal) {
      kitchenModal.classList.add('hidden');
    }
  });

  if (getToken()) loadOrders();
  else showLogin();
})();
