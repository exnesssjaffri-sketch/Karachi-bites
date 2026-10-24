const checkoutPage = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const cart = cartStore.getCart();
    const totals = cartPage._calcTotals(cart);
    const container = document.getElementById('app');

    const orderItemsHtml = cart.items.map(item => `
      <div class="flex items-start gap-space-sm">
        <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#211E1B] border border-[#3A342E]">
          <img src="${item.image || ''}" alt="${item.name}" class="w-full h-full object-cover" loading="lazy" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-label-md text-label-md text-[#F7F3EC] truncate">${item.name}</p>
          <p class="font-body-sm text-body-sm text-[#B8B0A6]">Qty: ${item.quantity} x Rs. ${item.price.toLocaleString('en-PK')}</p>
        </div>
        <span class="font-price-display text-price-display text-[#B42318] font-bold whitespace-nowrap">Rs. ${(item.price * item.quantity).toLocaleString('en-PK')}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-lg md:py-space-xl">
        <!-- Progress Stepper Header -->
        <section class="w-full bg-[#2A2622] border-b border-[#3A342E] shadow-sm">
          <div class="w-full max-w-7xl mx-auto px-6 py-space-md">
            <div class="mb-3">
              <a href="#cart" data-link class="inline-flex items-center gap-1.5 font-label-md text-label-md text-[#B8B0A6] hover:text-[#F7F3EC] transition-colors">
                <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Back to Cart</span>
              </a>
            </div>
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div class="flex items-center gap-space-sm">
                <div class="w-9 h-9 rounded-full bg-[#211E1B] border border-[#3A342E] flex items-center justify-center text-[#B42318]">
                  <span class="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div>
                  <h1 class="font-headline-sm text-headline-sm text-[#F7F3EC] font-semibold tracking-tight">Secure Checkout</h1>
                  <p class="font-body-sm text-body-sm text-[#B8B0A6]">Encrypted transactional channel • Burns Road Central Dispatch</p>
                </div>
              </div>
              <ol class="flex items-center gap-space-xs sm:gap-space-sm">
                <li class="flex items-center gap-1.5 text-[#F7F3EC] font-label-sm text-label-sm">
                  <span class="w-6 h-6 rounded-full bg-[#B42318] text-[#F7F3EC] flex items-center justify-center font-bold">1</span>
                  <span class="font-semibold">Contact</span>
                </li>
                <li class="flex items-center gap-1.5 text-[#B8B0A6] font-label-sm text-label-sm">
                  <span class="w-6 h-6 rounded-full bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] flex items-center justify-center font-bold">2</span>
                  <span>Delivery</span>
                </li>
                <li class="flex items-center gap-1.5 text-[#B8B0A6] font-label-sm text-label-sm">
                  <span class="w-6 h-6 rounded-full bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] flex items-center justify-center font-bold">3</span>
                  <span>Payment</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <!-- Main Checkout Content -->
        <main class="w-full max-w-7xl mx-auto px-6 py-space-lg md:py-space-xl">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <!-- Form Column -->
            <div class="lg:col-span-7 flex flex-col gap-space-md">
              <!-- Guest Checkout Banner -->
              <div class="p-space-md bg-[#211E1B] border border-[#3A342E] rounded-xl flex items-start sm:items-center justify-between gap-space-sm shadow-sm">
                <div class="flex items-center gap-space-sm">
                  <span class="material-symbols-outlined text-[#B42318] text-[22px]">flash_on</span>
                  <div>
                    <p class="font-label-md text-label-md text-[#F7F3EC] font-semibold">Guest Checkout Enabled</p>
                    <p class="font-body-sm text-body-sm text-[#B8B0A6]">No account required. Quick checkout with phone number.</p>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="bg-[#2A2622] border border-[#3A342E] p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-space-xs">
                    <span class="w-6 h-6 rounded bg-[#B42318] text-[#F7F3EC] font-label-sm text-label-sm flex items-center justify-center font-bold">1</span>
                    <h2 class="font-headline-sm text-headline-sm text-[#F7F3EC]">Customer Contact</h2>
                  </div>
                  <span class="font-label-sm text-label-sm text-[#B8B0A6] uppercase tracking-wider">Required</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div class="sm:col-span-2 flex flex-col gap-1">
                    <label class="font-label-md text-label-md text-[#F7F3EC] font-semibold">Full Name <span class="text-[#B42318]">*</span></label>
                    <input id="customerName" type="text" required autocomplete="name" placeholder="Enter your full name" class="w-full h-11 px-3.5 rounded-lg border border-[#3A342E] bg-[#181614] text-[#F7F3EC] placeholder-[#B8B0A6]/60 font-body-md outline-none focus:border-[#B42318]" />
                  </div>
                  <div class="sm:col-span-2 flex flex-col gap-1">
                    <label class="font-label-md text-label-md text-[#F7F3EC] font-semibold">Phone Number <span class="text-[#B42318]">*</span></label>
                    <input id="customerPhone" type="tel" required autocomplete="tel" placeholder="03XXXXXXXXX" pattern="[0-9]{10,11}" class="w-full h-11 px-3.5 rounded-lg border border-[#3A342E] bg-[#181614] text-[#F7F3EC] placeholder-[#B8B0A6]/60 font-body-md outline-none focus:border-[#B42318]" />
                  </div>
                </div>
              </div>

              <!-- Delivery Address -->
              <div class="bg-[#2A2622] border border-[#3A342E] p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-space-xs">
                    <span class="w-6 h-6 rounded bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] flex items-center justify-center font-bold">2</span>
                    <h2 class="font-headline-sm text-headline-sm text-[#F7F3EC]">Delivery Address</h2>
                  </div>
                  <span class="font-label-sm text-label-sm text-[#B8B0A6] uppercase tracking-wider">Dispatch Location</span>
                </div>
                <div class="sm:col-span-2 flex flex-col gap-1">
                  <label class="font-label-md text-label-md text-[#F7F3EC] font-semibold">Delivery Address <span class="text-[#B42318]">*</span></label>
                  <textarea id="customerAddress" required minlength="10" maxlength="500" rows="3" placeholder="Full delivery address including area, street, building, and floor/flat number" class="w-full px-3.5 rounded-lg border border-[#3A342E] bg-[#181614] text-[#F7F3EC] placeholder-[#B8B0A6]/60 font-body-md outline-none focus:border-[#B42318] resize-none"></textarea>
                </div>
              </div>

              <!-- Payment Method -->
              <div class="bg-[#2A2622] border border-[#3A342E] p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-space-xs">
                    <span class="w-6 h-6 rounded bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] flex items-center justify-center font-bold">3</span>
                    <h2 class="font-headline-sm text-headline-sm text-[#F7F3EC]">Payment Method</h2>
                  </div>
                  <span class="font-label-sm text-label-sm text-[#B8B0A6] uppercase tracking-wider">Settlement Mode</span>
                </div>
                <label class="relative flex items-center p-space-md rounded-lg border border-[#3A342E] bg-[#181614] cursor-pointer hover:border-[#B42318]/50">
                  <input type="radio" name="paymentMethod" value="cod" checked class="absolute opacity-0" />
                  <div class="flex items-center gap-space-md w-full">
                    <div class="w-5 h-5 rounded-full border-2 border-[#3A342E] flex items-center justify-center">
                      <span class="w-2 h-2 rounded-full bg-[#B42318] hidden peer-checked:block" aria-hidden="true"></span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-label-md text-label-md text-[#F7F3EC] font-semibold">Cash on Delivery</span>
                      <span class="font-body-sm text-body-sm text-[#B8B0A6]">Pay when your order arrives</span>
                    </div>
                  </div>
                </label>
              </div>

              <!-- Place Order Button -->
              <button id="placeOrderBtn" class="w-full lg:w-auto px-8 py-4 rounded-lg bg-[#B42318] hover:bg-[#C93627] text-white font-title-md text-title-md font-semibold shadow-md transition-all">Place Order</button>
            </div>

            <!-- Order Summary Sidebar -->
            <div class="lg:col-span-5">
              <div class="bg-[#2A2622] border border-[#3A342E] rounded-xl p-space-lg sticky top-28 shadow-sm">
                <h3 class="font-headline-sm text-headline-sm text-[#F7F3EC] font-semibold mb-space-md">Order Summary</h3>

                <div class="space-y-space-sm font-body-md text-body-md mb-space-md">
                  ${orderItemsHtml}
                </div>

                <div class="border-t border-[#3A342E] pt-space-md space-y-space-sm">
                  <div class="flex justify-between font-body-md text-body-md">
                    <span class="text-[#B8B0A6]">Subtotal</span>
                    <span class="text-[#F7F3EC]">Rs. ${totals.subtotal.toLocaleString('en-PK')}</span>
                  </div>
                  <div class="flex justify-between font-body-md text-body-md">
                    <span class="text-[#B8B0A6]">Delivery Fee</span>
                    <span class="text-[#F7F3EC]">Rs. ${totals.deliveryFee.toLocaleString('en-PK')}</span>
                  </div>
                </div>

                <div class="border-t border-[#3A342E] mt-space-md pt-space-md flex justify-between items-center">
                  <span class="font-headline-sm text-headline-sm text-[#F7F3EC] font-semibold">Total</span>
                  <span class="font-price-display text-price-display text-[#B42318] font-bold">Rs. ${totals.grandTotal.toLocaleString('en-PK')}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    applyI18n(container);
  },

  bindEvents() {
    document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('customerName')?.value.trim();
      const phone = document.getElementById('customerPhone')?.value.trim();
      const address = document.getElementById('customerAddress')?.value.trim();

      if (!name || name.length < 2) { alert('Please enter your full name.'); return; }
      if (!phone || phone.length < 10) { alert('Please enter a valid phone number.'); return; }
      if (!address || address.length < 10) { alert('Please enter a complete delivery address.'); return; }

      const cart = cartStore.getCart();
      if (cart.items.length === 0) { alert('Your cart is empty.'); return; }

      try {
        const btn = document.getElementById('placeOrderBtn');
        btn.disabled = true;
        btn.textContent = 'Placing order...';

        const result = await window.api.createOrder({
          customer: { name, phone, address },
          branch: 'Clifton',
          items: cart.items,
        });

        if (result.success && result.data && result.data.orderId) {
          cartStore.clearCart();
          window.location.hash = '#order-placed?order=' + encodeURIComponent(result.data.orderId);
        } else {
          alert(result.error || 'Failed to place order. Please try again.');
          btn.disabled = false;
          btn.textContent = 'Place Order';
        }
      } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to place order. Please try again.');
        const btn = document.getElementById('placeOrderBtn');
        btn.disabled = false;
        btn.textContent = 'Place Order';
      }
    });
  },
};