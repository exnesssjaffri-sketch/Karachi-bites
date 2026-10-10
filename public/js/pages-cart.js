const cartPage = {
  init() {
    this.render();
    this.bindEvents();
    window.addEventListener('cartUpdated', () => this.render());
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
            <span class="text-[#F7F3EC] font-medium">Your Cart</span>
          </nav>
          
          <div class="flex items-center justify-between mb-8">
            <h1 class="font-headline text-2xl font-semibold">Your Cart</h1>
            <span class="text-[#B8B0A6] bg-[#2A2622] px-3 py-1 rounded-full text-sm">${cart.itemCount} item${cart.itemCount !== 1 ? 's' : ''}</span>
          </div>

          ${cart.items.length === 0 ? `
            <div class="text-center py-16">
              <span class="material-symbols-outlined text-4xl text-[#B8B0A6]/40 mb-4">shopping_cart</span>
              <p class="text-[#B8B0A6] mb-4">Your cart is empty</p>
              <a href="#menu" class="bg-[#B42318] hover:bg-[#9E1C13] text-white px-6 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2" data-link>
                <span class="material-symbols-outlined text-sm">add</span> Browse Menu
              </a>
            </div>
          ` : `
            <div class="bg-[#2A2622] rounded-xl border border-[#3A342E] divide-y divide-[#3A342E] overflow-hidden">
              ${cart.items.map(item => `
                <div class="p-4 flex items-center justify-between gap-4">
                  <div class="flex-1">
                    <h3 class="font-title text-[#F7F3EC] font-medium">${item.name}</h3>
                    <p class="text-[#B8B0A6] text-sm">${cartStore.formatPrice(item.price)}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="qty-btn w-8 h-8 rounded bg-[#181614] text-white flex items-center justify-center hover:bg-[#3A342E]" data-id="${item.id}" data-action="decrease">-</button>
                    <span class="w-8 text-center font-medium">${item.quantity}</span>
                    <button class="qty-btn w-8 h-8 rounded bg-[#181614] text-white flex items-center justify-center hover:bg-[#3A342E]" data-id="${item.id}" data-action="increase">+</button>
                  </div>
                  <div class="font-price text-[#B42318] whitespace-nowrap">${cartStore.formatPrice(item.price * item.quantity)}</div>
                </div>
              `).join('')}
            </div>

            <div class="mt-6 flex items-center gap-2 text-sm text-[#B8B0A6]">
              <input id="promoInput" type="text" placeholder="Promo Code" class="flex-1 px-4 py-2 rounded bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318] text-sm"/>
              <button id="applyPromoBtn" class="px-4 py-2 bg-[#2A2622] hover:bg-[#3A342E] border border-[#3A342E] text-white rounded-lg text-sm font-medium transition-all">Apply</button>
            </div>

            <div class="mt-6 bg-[#2A2622] rounded-xl border border-[#3A342E] p-6">
              <div class="flex justify-between text-[#B8B0A6] mb-2">
                <span>Item Subtotal</span>
                <span class="text-[#F7F3EC]">${cartStore.formatPrice(cart.total)}</span>
              </div>
              <div class="flex justify-between text-[#B8B0A6] mb-2">
                <span>Delivery Fee</span>
                <span class="text-[#F7F3EC]">Rs. 150</span>
              </div>
              <div class="flex justify-between text-[#B42318] mb-4">
                <span>Discount</span>
                <span class="line-through text-[#5c534b] mr-2">Rs. 150</span>
              </div>
              <div class="h-px bg-[#3A342E] mb-4"></div>
              <div class="flex justify-between font-title text-lg">
                <span>Total</span>
                <span class="font-price text-[#B42318]">${cartStore.formatPrice(cart.total + 150)}</span>
              </div>
              
              <button id="checkoutBtn" class="w-full mt-6 bg-[#B42318] hover:bg-[#9E1C13] text-white py-3 rounded-lg font-title">Proceed to Checkout</button>
            </div>
          `}
        </div>
      </section>
    `;
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
    
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
      window.location.hash = '#checkout';
    });
  },

  updateBadge() {
    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = cartStore.getCart().itemCount;
  },
};

window.addEventListener('DOMContentLoaded', () => cartPage.init());