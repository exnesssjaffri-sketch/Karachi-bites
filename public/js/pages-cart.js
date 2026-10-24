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
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 150;
    const grandTotal = subtotal + deliveryFee;
    return { subtotal, deliveryFee, grandTotal };
  },

  _renderActiveCart(cart, totals) {
    return `
      <div class="grid lg:grid-cols-12 gap-space-lg">
        <div class="lg:col-span-7">
          <div class="flex items-center gap-space-xs mb-space-md">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-label-md text-label-md text-emerald-400 font-medium">Open & Sizzling — Ready for Dispatch</span>
          </div>
          <div class="bg-[#2A2622] border border-[#3A342E] rounded-xl divide-y divide-[#3A342E]/40">
            ${cart.items.map(item => `
              <article class="pt-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md transition-all hover:bg-[#211E1B]/60 p-space-sm rounded-lg border-b border-[#3A342E]/40 last:border-b-0" data-item-id="${item.id}">
                <div class="flex items-start gap-space-md min-w-0">
                  <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-[#211E1B] border border-[#3A342E] relative shadow-sm">
                    <img src="${item.image || ''}" alt="${item.name}" class="w-full h-full object-cover" loading="lazy" />
                    <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#3A342E] text-[#F7F3EC] border border-[#3A342E] font-label-sm text-[10px] uppercase font-bold">Kitchen</span>
                  </div>
                  <div class="flex flex-col gap-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="w-3.5 h-3.5 rounded bg-[#211E1B] border border-[#3A342E] flex items-center justify-center text-[#B8B0A6] text-[9px] font-bold">H</span>
                      <h2 class="font-headline-sm text-headline-sm text-[#F7F3EC] truncate">${item.name}</h2>
                    </div>
                    <p class="font-body-sm text-body-sm text-[#B8B0A6] line-clamp-2">Prepared fresh to order</p>
                    <div class="flex items-center gap-space-sm pt-1">
                      <span class="font-price-display text-price-display text-[#B42318] font-bold">Rs. ${(item.price * item.quantity).toLocaleString('en-PK')}</span>
                      <span class="font-body-sm text-body-sm text-[#B8B0A6]">(Rs. ${item.price.toLocaleString('en-PK')} each)</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between sm:justify-end gap-space-md w-full sm:w-auto shrink-0 pt-space-xs sm:pt-0">
                  <div class="inline-flex items-center bg-[#211E1B] border border-[#3A342E] rounded-lg p-0.5 shadow-inner">
                    <button class="qty-btn w-8 h-8 rounded-md bg-[#2A2622] text-[#F7F3EC] border border-[#3A342E] flex items-center justify-center hover:bg-[#322D28] transition-colors shadow-sm" data-id="${item.id}" data-action="decrease"><span class="material-symbols-outlined text-[16px]">remove</span></button>
                    <span class="w-10 text-center font-label-md text-label-md text-[#F7F3EC] font-semibold" id="item-${item.id}-qty">${item.quantity}</span>
                    <button class="qty-btn w-8 h-8 rounded-md bg-[#2A2622] text-[#F7F3EC] border border-[#3A342E] flex items-center justify-center hover:bg-[#322D28] transition-colors shadow-sm" data-id="${item.id}" data-action="increase"><span class="material-symbols-outlined text-[16px]">add</span></button>
                  </div>
                  <button class="remove-btn inline-flex items-center gap-1 text-[#B8B0A6] hover:text-[#ff6b6b] transition-colors px-2 py-1.5 rounded-md hover:bg-[#451210]/40" data-id="${item.id}"><span class="material-symbols-outlined text-[18px]">delete</span><span class="font-label-sm text-label-sm font-medium">Remove</span></button>
                </div>
              </article>
            `).join('')}
          </div>
          <div class="mt-space-lg">
            <label class="block font-label-md text-label-md text-[#F7F3EC] mb-space-sm">Special Instructions</label>
            <textarea class="w-full bg-[#2A2622] border border-[#3A342E] rounded-xl px-4 py-3 font-body-md text-[#F7F3EC] placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318] resize-none" rows="3" placeholder="Any cooking or delivery preferences..." id="cartInstructions"></textarea>
          </div>
        </div>
        <div class="lg:col-span-5">
          <div class="bg-[#2A2622] border border-[#3A342E] rounded-xl p-space-lg sticky top-28 shadow-sm">
            <h3 class="font-headline-sm text-headline-sm text-[#F7F3EC] font-semibold mb-space-md">Order Summary</h3>
            <div class="space-y-space-sm font-body-md text-body-md">
              <div class="flex justify-between"><span class="text-[#B8B0A6]">Subtotal</span><span class="text-[#F7F3EC]">Rs. ${totals.subtotal.toLocaleString('en-PK')}</span></div>
              <div class="flex justify-between"><span class="text-[#B8B0A6]">Delivery Fee</span><span class="text-[#F7F3EC]">Rs. ${totals.deliveryFee.toLocaleString('en-PK')}</span></div>
            </div>
            <div class="border-t border-[#3A342E] mt-space-md pt-space-md flex justify-between items-center"><span class="font-headline-sm text-headline-sm text-[#F7F3EC] font-semibold">Total</span><span class="font-price-display text-price-display text-[#B42318] font-bold">Rs. ${totals.grandTotal.toLocaleString('en-PK')}</span></div>
            <button id="checkoutBtn" class="w-full mt-space-lg px-6 py-3 rounded-lg bg-[#B42318] hover:bg-[#C93627] text-white font-title-md text-title-md font-semibold shadow-md transition-all active:scale-95">Proceed to Checkout</button>
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
      <div class="w-full max-w-7xl mx-auto px-margin md:px-margin-desktop py-space-lg md:py-space-xl" id="cart-root">
        <!-- Top Breadcrumb & Editorial Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div class="flex flex-col gap-space-xs">
            <nav class="flex items-center gap-space-xs font-label-sm text-label-sm text-[#B8B0A6]">
              <a class="hover:text-[#B42318] transition-colors flex items-center gap-1" href="#menu" data-link>
                <span class="material-symbols-outlined text-[14px]">arrow_back</span>
                Menu
              </a>
              <span class="opacity-40">/</span>
              <span class="text-[#F7F3EC] font-semibold">Cart & Dispatch Ledger</span>
            </nav>
            <div class="flex items-baseline gap-space-sm">
              <h1 class="font-headline-lg text-headline-lg text-[#F7F3EC] tracking-tight">Your Order Cart</h1>
              <span class="font-label-md text-label-md px-2 py-0.5 rounded-full bg-[#3A211E] text-[#B42318] font-semibold border border-[#B42318]/30" id="cart-count-pill">${cart.itemCount} item${cart.itemCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <!-- Quick Actions & View State Toggle -->
          <div class="flex items-center gap-space-sm">
            <button id="toggleStateBtn" type="button" class="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] hover:bg-[#2A2622] hover:text-[#F7F3EC] transition-colors font-label-sm text-label-sm">Edit Cart</button>
          </div>
        </div>

        ${cart.items.length === 0 ? `
          <!-- Empty State View -->
          <div id="emptyCartView" class="flex flex-col items-center justify-center py-space-2xl text-center">
            <span class="material-symbols-outlined text-5xl text-[#B42318]/40 mb-space-md">shopping_bag</span>
            <h2 class="font-headline-sm text-headline-sm text-[#F7F3EC] mb-space-xs">Your Cart is Empty</h2>
            <p class="font-body-md text-body-md text-[#B8B0A6] max-w-sm mb-space-lg">No dishes added yet. Start building your dispatch order from the heritage menu.</p>
            <div class="flex flex-col sm:flex-row items-center gap-space-sm w-full sm:w-auto">
              <a class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#B42318] hover:bg-[#C93627] text-white font-title-md text-title-md font-semibold shadow-md transition-all" href="#menu" data-link>
                <span class="material-symbols-outlined text-[20px]">menu_book</span>
                <span>Explore Menu</span>
              </a>
              <button class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#211E1B] hover:bg-[#322D28] text-[#F7F3EC] border border-[#3A342E] font-title-md text-title-md font-medium transition-colors" type="button">
                <span>Restore 0 Items</span>
              </button>
            </div>
            <!-- Quick Category Shortcuts inside Empty View -->
            <div class="mt-space-xl pt-space-lg w-full flex flex-wrap items-center justify-center gap-2 border-t border-[#3A342E]">
              <span class="font-label-sm text-label-sm text-[#B8B0A6] mr-2">Popular Right Now:</span>
              <span class="px-3 py-1 rounded-full bg-[#211E1B] border border-[#3A342E] text-[#F7F3EC] font-label-md text-label-md hover:bg-[#2A2622] cursor-pointer transition-colors">Nihari Shank</span>
              <span class="px-3 py-1 rounded-full bg-[#211E1B] border border-[#3A342E] text-[#F7F3EC] font-label-md text-label-md hover:bg-[#2A2622] cursor-pointer transition-colors">Dum Biryani</span>
              <span class="px-3 py-1 rounded-full bg-[#211E1B] border border-[#3A342E] text-[#F7F3EC] font-label-md text-label-md hover:bg-[#2A2622] cursor-pointer transition-colors">Beef Seekh</span>
              <span class="px-3 py-1 rounded-full bg-[#211E1B] border border-[#3A342E] text-[#F7F3EC] font-label-md text-label-md hover:bg-[#2A2622] cursor-pointer transition-colors">Tandoori Naan</span>
            </div>
          </div>
        ` : this._renderActiveCart(cart, totals)}
      </div>
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

