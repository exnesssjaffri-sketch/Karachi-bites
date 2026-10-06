const orderPlacedPage = {
  orderData: null,
  orderId: null,
  loading: true,
  error: null,

  async init() {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    this.orderId = params.get('order') || null;

    if (this.orderId) {
      await this.fetchOrder();
    }

    this.loading = false;
    this.render();
  },

  async fetchOrder() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const result = await api.getOrder(this.orderId);
      if (result.success) {
        this.orderData = result.data;
        this.orderId = result.data.id || this.orderId;
      } else {
        this.error = result.error || 'Order not found';
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
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
          <div class="max-w-2xl mx-auto text-center">
            <span class="material-symbols-outlined text-6xl text-[#B42318] animate-pulse">hourglass_bottom</span>
            <p class="text-[#B8B0A6] mt-4">Loading order details...</p>
          </div>
        </section>
      `;
      return;
    }

    const order = this.orderData;
    const displayId = order ? (order.id || this.orderId) : this.orderId;
    const displayTotal = order ? order.total : 0;
    const displayItems = order ? (order.items || []) : [];

    container.innerHTML = `
      <section class="pt-28 pb-24 px-6">
        <div class="max-w-2xl mx-auto text-center">
          <div class="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-4xl text-green-500">check_circle</span>
          </div>

          <h1 class="font-headline text-3xl font-semibold mb-2">Order Confirmed!</h1>
          <p class="text-[#B8B0A6] mb-6">Thank you for your order. We're preparing it now.</p>

          <div class="bg-[#2A2622] rounded-xl border border-[#3A342E] p-6 mb-8 text-left">
            <div class="flex justify-between text-[#B8B0A6] text-sm mb-2">
              <span>Order ID</span>
              <span class="text-[#F7F3EC] font-medium">${displayId}</span>
            </div>
            <div class="flex justify-between text-[#B8B0A6] text-sm mb-2">
              <span>Estimated Delivery</span>
              <span class="text-[#F7F3EC]">30-45 minutes</span>
            </div>
            <div class="flex justify-between text-[#B8B0A6] text-sm mb-4">
              <span>Payment Method</span>
              <span class="text-[#F7F3EC]">Cash on Delivery</span>
            </div>
            <div class="border-t border-[#3A342E] pt-4">
              <div class="font-title text-[#F7F3EC] mb-2">Order Items</div>
              ${displayItems.map(item => `
                <div class="flex justify-between text-[#B8B0A6] text-sm mb-1">
                  <span>${item.name || 'Item'} x${item.qty || item.quantity || 1}</span>
                  <span class="text-[#F7F3EC]">${cartStore.formatPrice(item.price * (item.qty || item.quantity || 1))}</span>
                </div>
              `).join('')}
              <div class="flex justify-between text-[#B8B0A6] text-sm mt-2 pt-2 border-t border-[#3A342E]">
                <span>Total</span>
                <span class="text-[#B42318] font-price">${cartStore.formatPrice(displayTotal)}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#tracking?order=${displayId}" class="bg-[#B42318] hover:bg-[#9E1C13] text-white px-6 py-3 rounded-lg font-title inline-flex items-center gap-2" data-link>
              <span class="material-symbols-outlined">location_on</span>
              Track Order
            </a>
            <a href="#menu" class="bg-[#2A2622] hover:bg-[#3A342E] border border-[#3A342E] text-white px-6 py-3 rounded-lg font-title inline-flex items-center gap-2" data-link>
              <span class="material-symbols-outlined">restaurant</span>
              Continue Shopping
            </a>
          </div>
        </div>
      </section>
    `;
  },
};

window.addEventListener('DOMContentLoaded', () => orderPlacedPage.init());
