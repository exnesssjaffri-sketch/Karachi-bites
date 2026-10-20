(() => {
  'use strict';

  const TOKEN_KEY = 'karachi_bites_admin_token';
  const API_BASE_URL = '';
  const $ = (selector) => document.querySelector(selector);
  const loginPanel = $('#loginPanel');
  const dashboardPanel = $('#dashboardPanel');
  const loginForm = $('#loginForm');
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
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
  }

  function showLogin() {
    loginPanel.classList.remove('hidden');
    dashboardPanel.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }

  function showDashboard() {
    loginPanel.classList.add('hidden');
    dashboardPanel.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  }

  async function requestJson(url, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (options.body) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || ('Request failed (' + response.status + ')'));
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function login(event) {
    event.preventDefault();
    clearNotice();
    setBusy(loginBtn, true, 'Signing in…');
    try {
      const username = $('#username').value.trim();
      const password = $('#password').value;
      const response = await requestJson('/api/auth/login', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ username, password })
      });
      if (!response.token) throw new Error('The login API did not return a token.');
      saveToken(response.token);
      await loadOrders();
      $('#password').value = '';
    } catch (error) {
      clearToken();
      showLogin();
      showNotice(error.status === 403
        ? 'This account can sign in, but it does not have the admin role.'
        : error.status === 401
          ? 'Username or password is incorrect.'
          : (error.message || 'Unable to sign in.'), true);
    } finally {
      setBusy(loginBtn, false);
    }
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
        emptyTable('Sign in with an admin account to view orders.');
        showNotice(error.status === 403
          ? 'This user is not authorized to manage orders. An admin account is required.'
          : 'Your session has expired. Please sign in again.', true);
        return;
      }
      emptyTable('Orders could not be loaded.');
      showNotice(error.message || 'Unable to load orders.', true);
    } finally {
      setBusy(refreshBtn, false);
    }
  }

  loginForm.addEventListener('submit', login);
  logoutBtn.addEventListener('click', () => {
    clearToken();
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
