const checkoutPage = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const cart = cartStore.getCart();
    const container = document.getElementById('app');
    
    container.innerHTML = `
      <section class="pt-28 pb-24 px-6">
        <div class="max-w-3xl mx-auto">
          <nav class="flex items-center gap-2 text-[#B8B0A6] text-sm mb-6">
            <a href="#home" class="hover:text-[#B42318]" data-link>Home</a>
            <span>›</span>
            <a href="#cart" class="hover:text-[#B42318]" data-link>Cart</a>
            <span>›</span>
            <span class="text-[#F7F3EC] font-medium">Checkout</span>
          </nav>

          <h1 class="font-headline text-2xl font-semibold mb-8">Checkout</h1>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-[#2A2622] rounded-xl border border-[#3A342E] p-6">
              <h2 class="font-title text-[#F7F3EC] font-semibold text-lg mb-4">Contact Information</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-[#B8B0A6] text-sm mb-2">Full Name</label>
                  <input id="customerName" type="text" placeholder="Enter your name" class="w-full px-4 py-2.5 rounded-lg bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318] text-sm"/>
                </div>
                <div>
                  <label class="block text-[#B8B0A6] text-sm mb-2">Phone Number</label>
                  <input id="customerPhone" type="tel" placeholder="03XXXXXXXXX" class="w-full px-4 py-2.5 rounded-lg bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318] text-sm"/>
                </div>
                <div>
                  <label class="block text-[#B8B0A6] text-sm mb-2">Email (Optional)</label>
                  <input id="customerEmail" type="email" placeholder="you@example.com" class="w-full px-4 py-2.5 rounded-lg bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318] text-sm"/>
                </div>
              </div>
            </div>

            <div class="bg-[#2A2622] rounded-xl border border-[#3A342E] p-6">
              <h2 class="font-title text-[#F7F3EC] font-semibold text-lg mb-4">Order Summary</h2>
              
              <div class="space-y-3 mb-4 max-h-40 overflow-y-auto">
                ${cart.items.map(item => `
                  <div class="flex justify-between text-[#B8B0A6] text-sm">
                    <span>${item.name} x${item.quantity}</span>
                    <span class="text-[#F7F3EC]">${cartStore.formatPrice(item.price * item.quantity)}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="space-y-2 mb-4 border-t border-[#3A342E] pt-4">
                <div class="flex justify-between text-[#B8B0A6] text-sm">
                  <span>Subtotal</span>
                  <span class="text-[#F7F3EC]">${cartStore.formatPrice(cart.total)}</span>
                </div>
                <div class="flex justify-between text-[#B8B0A6] text-sm">
                  <span>Delivery Fee</span>
                  <span class="text-[#F7F3EC]">Rs. 150</span>
                </div>
                <div class="flex justify-between text-[#B8B0A6] text-sm">
                  <span>Discount</span>
                  <span class="text-[#F7F3EC]">Rs. 0</span>
                </div>
              </div>
              
              <div class="flex justify-between font-title text-lg border-t border-[#3A342E] pt-4 mb-6">
                <span>Total</span>
                <span class="font-price text-[#B42318]">${cartStore.formatPrice(cart.total + 150)}</span>
              </div>

              <button id="placeOrderBtn" class="w-full bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-title shadow-lg transition-all">Place Order</button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  bindEvents() {
    document.getElementById('placeOrderBtn')?.addEventListener('click', () => this.placeOrder());
  },

  async placeOrder() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    
    if (!name) {
      alert('Please enter your name');
      return;
    }
    if (!phone) {
      alert('Please enter your phone number');
      return;
    }
    
    const cart = cartStore.getCart();
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    const orderData = {
      customer: { name, phone, address: email || 'Not provided' },
      branch: 'Clifton',
      items: cart.items.map(item => ({ id: item.id, qty: item.quantity })),
      total: cart.total + 150,
    };

    const result = await api.createOrder(orderData);
    if (result.success) {
      cartStore.clearCart();
      window.location.hash = '#order-placed?order=' + result.data.orderId;
    } else {
      alert('Failed to place order: ' + result.error);
    }
  },
};

window.addEventListener('DOMContentLoaded', () => checkoutPage.init());