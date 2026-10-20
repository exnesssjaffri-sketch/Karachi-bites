const cartPage = {
  init() {
    this.render();
    this.bindEvents();
    if (!this._cartListenerBound) {
      window.addEventListener('cartUpdated', () => {
        if ((window.location.hash || '').split('?')[0] === '#cart') {
          this.render();
          this.bindEvents();
        }
      });
      this._cartListenerBound = true;
    }
  },

  _calcTotals(cart) {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const deliveryFee = 150;
    const grandTotal = subtotal + deliveryFee;
    return { subtotal, deliveryFee, grandTotal };
  },

  _renderActiveCart(cart, totals) {
    return `
      <div class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span class="text-sm text-green-400 font-medium" data-i18l-text="cart.kitchenStatus">Open & Sizzling</span>
          </div>

          <div class="bg-[#2A2622] rounded-xl divide-y divide-[#3A3530]">
            ${cart.items.map(item => `
              <div class="flex items-center gap-4 p-4" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-1">
                  <h4 class="font-medium" data-i18l-text="menu.${item.nameKey}">${item.name}</h4>
                  <p class="text-[#B42318] font-semibold">Rs. ${item.price}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button class="qty-btn w-8 h-8 rounded-lg bg-[#3A3530] hover:bg-[#4A4540] flex items-center justify-center" data-id="${item.id}" data-action="decrease">-</button>
                  <span class="w-8 text-center font-medium">${item.qty}</span>
                  <button class="qty-btn w-8 h-8 rounded-lg bg-[#3A3530] hover:bg-[#4A4540] flex items-center justify-center" data-id="${item.id}" data-action="increase">+</button>
                </div>
                <button class="remove-btn text-[#B8B0A6] hover:text-[#B42318] text-sm" data-id="${item.id}" data-i18l-text="cart.remove">Remove</button>
              </div>
            `).join('')}
          </div>

          <div class="mt-6">
            <label class="block text-sm font-medium mb-2" data-i18l-text="cart.instructions">Special Instructions</label>
            <textarea class="w-full bg-[#2A2622] border border-[#3A3530] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#B42318]" rows="3" placeholder="Any cooking or delivery preferences..." data-i18l-text="cart.instructionsPlaceholder"></textarea>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="bg-[#2A2622] rounded-xl p-6 sticky top-28">
            <h3 class="font-headline text-lg font-semibold mb-4" data-i18l-text="cart.orderSummary">Order Summary</h3>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span data-i18l-text="cart.subtotal">Subtotal</span><span>Rs. ${totals.subtotal.toFixed(0)}</span></div>
              <div class="flex justify-between"><span data-i18l-text="cart.deliveryFee">Delivery Fee</span><span>Rs. ${totals.deliveryFee.toFixed(0)}</span></div>
            </div>

            <div class="border-t border-[#3A3530] mt-4 pt-4 flex justify-between items-center">
              <span class="font-headline font-semibold" data-i18l-text="cart.total">Total</span>
              <span class="text-2xl font-bold text-[#B42318]">Rs. ${totals.grandTotal.toFixed(0)}</span>
            </div>

            <button id="checkoutBtn" class="w-full mt-6 bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-semibold" data-i18l-text="cart.checkout">Proceed to Checkout</button>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    const cart = cartStore.getCart();
    const container = document.getElementById('app');
    const totals = this._calcTotals(cart);

    container.innerHTML = `
      <section class="pt-28 pb-24 px-6">
        <div class="max-w-7xl mx-auto">
          <nav class="flex items-center gap-2 text-[#B8B0A6] text-sm mb-6">
            <a href="#home" class="hover:text-[#B42318]" data-link data-i18l-text="common.home">Home</a>
            <span>›</span>
            <span class="text-[#F7F3EC] font-medium" data-i18l-text="cart.title">Your Cart</span>
          </nav>

          <div class="flex items-center justify-between mb-8">
            <h1 class="font-headline text-2xl font-semibold" data-i18l-text="cart.title">Your Cart</h1>
            <span class="text-[#B8B0A6] bg-[#2A2622] px-3 py-1 rounded-full text-sm">${cart.itemCount} item${cart.itemCount !== 1 ? 's' : ''}</span>
          </div>

          ${cart.items.length === 0 ? `
            <div class="text-center py-16">
              <span class="material-symbols-outlined text-4xl text-[#B8B0A6]/40 mb-4">shopping_cart</span>
              <p class="text-[#B8B0A6] mb-4" data-i18l-text="cart.empty">Your cart is empty</p>
              <a href="#menu" class="bg-[#B42318] hover:bg-[#9E1C13] text-white px-6 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2" data-link>
                <span class="material-symbols-outlined text-sm">add</span> <span data-i18l-text="cart.browseMenu">Browse Menu</span>
              </a>
            </div>
          ` : this._renderActiveCart(cart, totals)}
        </div>
      </section>
    `;
    applyI18n(container);
  },

  bindEvents() {
    document.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const action = btn.dataset.action;
        cartStore.updateQuantity(id, action === 'increase' ? 1 : -1);
        this.render();
        this.updateBadge();
      });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        cartStore.removeItem(id);
        this.render();
        this.updateBadge();
      });
    });

    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
      window.location.hash = '#checkout';
    });
  },

  updateBadge() {
    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = cartStore.getCart().itemCount;
  },
};

