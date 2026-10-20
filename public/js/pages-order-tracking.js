const orderTrackingPage = {
  orderData: null,
  orderId: null,
  loading: false,
  error: null,

  phone: '',

  async init() {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    this.orderId = params.get('order') || null;
    this.phone = params.get('phone') || '';
    if (this.orderId) {
      await this.fetchOrder();
    }
    this.render();
  },

  async fetchOrder() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const result = await api.trackOrder(this.orderId, this.phone);
      if (result.success) {
        this.orderData = result.data;
        this.orderId = result.data.orderId || this.orderId;
      } else {
        this.error = result.error || 'Order not found';
      }
    } catch (err) {
      console.error('Failed to track order:', err);
      this.error = 'Failed to load order details';
    }

    this.loading = false;
    this.render();
  },

  render() {
    const container = document.getElementById('app');
    if (!container) return;

    if (this.loading) {
      container.innerHTML = `
        <section class="pt-28 pb-24 px-6">
          <div class="max-w-3xl mx-auto text-center">
            <span class="material-symbols-outlined text-6xl text-[#B42318] animate-pulse">hourglass_bottom</span>
            <p class="text-[#B8B0A6] mt-4" data-i18l-text="common.loading">Loading order details...</p>
          </div>
        </section>
      `;
      return;
    }

    if (this.error || !this.orderData) {
      container.innerHTML = `
        <section class="pt-28 pb-24 px-6">
          <div class="max-w-3xl mx-auto text-center">
            <span class="material-symbols-outlined text-6xl text-[#B42318] mb-4">search_off</span>
            <h2 class="font-headline text-2xl text-[#F7F3EC] mb-2" data-i18l-text="tracking.notFound">Order Not Found</h2>
            <p class="text-[#B8B0A6] mb-6">${this.error || 'Enter the order ID and phone number from your confirmation to check its latest status.'}</p>
            <form id="orderLookupForm" class="max-w-xl mx-auto mb-5 flex flex-col gap-3 text-left">
              <div>
                <label for="orderLookupId" class="sr-only">Order ID</label>
                <input id="orderLookupId" name="orderId" type="text" required maxlength="80" autocomplete="off" placeholder="e.g. KB-20261010-ABC123" class="w-full px-4 py-3 rounded-lg bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318]">
              </div>
              <div>
                <label for="orderLookupPhone" class="sr-only">Phone Number</label>
                <input id="orderLookupPhone" name="phone" type="tel" required autocomplete="tel" placeholder="03001234567" pattern="03[0-9]{9}" class="w-full px-4 py-3 rounded-lg bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318]">
              </div>
              <button type="submit" class="bg-[#B42318] hover:bg-[#9E1C13] text-white px-6 py-3 rounded-lg font-title" data-i18l-text="tracking.trackOrder">Track Order</button>
            </form>
            <a href="#home" class="text-[#B8B0A6] hover:text-white px-6 py-2 rounded-lg font-title inline-flex items-center gap-2" data-link>
              <span class="material-symbols-outlined text-sm">home</span>
              <span data-i18l-text="common.goHome">Go Home</span>
            </a>
          </div>
        </section>
      `;
      const lookupForm = container.querySelector('#orderLookupForm');
      if (lookupForm) {
        lookupForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const input = container.querySelector('#orderLookupId');
          const phoneInput = container.querySelector('#orderLookupPhone');
          const orderId = input ? input.value.trim() : '';
          const phone = phoneInput ? phoneInput.value.trim() : '';
          if (!orderId || !phone) return;
          window.location.hash = '#tracking?order=' + encodeURIComponent(orderId) + '&phone=' + encodeURIComponent(phone);
        });
      }
      return;
    }

    const order = this.orderData;
    const status = (order.status || 'pending').toLowerCase();
    const statusSteps = ['received', 'preparing', 'out-for-delivery', 'delivered'];
    const currentStepIndex = statusSteps.indexOf(status);
    const statusLabels = {
      delivered: 'tracking.status.delivered',
      'out-for-delivery': 'tracking.status.out-for-delivery',
      preparing: 'tracking.status.preparing',
      received: 'tracking.status.received'
    };

    container.innerHTML = `
      <section class="pt-28 pb-24 px-6">
        <div class="max-w-3xl mx-auto">
          <nav class="flex items-center gap-2 text-[#B8B0A6] text-sm mb-6">
            <a href="#home" class="hover:text-[#B42318]" data-link data-i18l-text="common.home">Home</a>
            <span>&rsaquo;</span>
            <span class="text-[#F7F3EC] font-medium" data-i18l-text="tracking.breadcrumb">Track Order</span>
          </nav>

          <div class="flex items-center justify-between mb-8">
            <h1 class="font-headline text-2xl font-semibold" data-i18l-text="tracking.title">Track Your Order</h1>
            <span class="text-[#B8B0A6] bg-[#2A2622] px-3 py-1 rounded-full text-sm">${order.orderId || this.orderId}</span>
          </div>

          <div class="bg-[#2A2622] rounded-xl border border-[#3A342E] p-6 mb-6">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-full bg-[#B42318]/20 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl text-[#B42318]">motorcycle</span>
              </div>
              <div>
                <h3 class="font-title text-[#F7F3EC] font-semibold" data-i18l-text="${statusLabels[status] || 'tracking.status.received'}">${statusLabels[status] || 'tracking.status.received'}</h3>
                <p class="text-[#B8B0A6] text-sm" data-i18l-text="tracking.eta">Estimated delivery: 30-45 minutes</p>
              </div>
            </div>

            <div class="space-y-4">
              ${statusSteps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const labelKey = 'tracking.step.' + step;
                const stateKey = isCurrent ? 'tracking.inProgress' : isCompleted ? 'tracking.completed' : 'tracking.pending';
                return `
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-600' : 'bg-[#3A342E]'}">
                      ${isCompleted ? '<span class="material-symbols-outlined text-sm text-white">check</span>' : ''}
                    </div>
                    <div>
                      <div class="text-[#F7F3EC] font-medium ${isCompleted ? '' : 'text-[#B8B0A6]'}" data-i18l-text="${labelKey}">${labelKey}</div>
                      <div class="text-[#B8B0A6] text-sm" data-i18l-text="${stateKey}">${stateKey}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="bg-[#2A2622] rounded-xl border border-[#3A342E] p-6">
            <h3 class="font-title text-[#F7F3EC] font-semibold mb-4" data-i18l-text="tracking.summary">Order Summary</h3>
            <div id="orderItems" class="space-y-3 mb-4">
              ${(order.items || []).map(item => `
                <div class="flex justify-between text-[#B8B0A6] text-sm">
                  <span>${item.name || 'Item'} x${item.quantity || 'N/A'}</span>
                  <span class="text-[#F7F3EC]">${cartStore.formatPrice(item.price * (item.quantity || 0))}</span>
                </div>
              `).join('')}
            </div>
            ${order.notes ? `<div class="mt-4 pt-4 border-t border-[#3A342E]"><div class="text-[#B8B0A6] text-sm mb-1" data-i18l-text="tracking.notes">Order Notes</div><div class="text-[#F7F3EC] text-sm">${order.notes}</div></div>` : ''}
            <div class="border-t border-[#3A342E] pt-4">
              <div class="flex justify-between text-[#B8B0A6] text-sm">
                <span data-i18l-text="common.total">Total</span>
                <span class="text-[#B42318] font-price">${cartStore.formatPrice(order.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    applyI18n(container);

  },
};

window.addEventListener('DOMContentLoaded', () => orderTrackingPage.init());
