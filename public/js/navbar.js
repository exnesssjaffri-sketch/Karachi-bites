/**
 * Navbar Component
 * Renders the navigation bar with cart count
 */
const navbar = {
  cartCount: 0,
  cartTotal: 0,
  cartCountBadge: null,

  init() {
    this.cartCountBadge = document.getElementById('cart-count-badge');
    this.updateBadge();

    // Listen for cart changes
    window.addEventListener('cartUpdated', () => {
      this.updateBadge();
    });
  },

  updateBadge() {
    const cart = cartStore.getCart();
    this.cartCount = cart.itemCount;
    this.cartTotal = cart.total;

    if (this.cartCountBadge) {
      this.cartCountBadge.textContent = this.cartCount;
      if (this.cartCount > 0) {
        this.cartCountBadge.classList.remove('hidden');
      } else {
        this.cartCountBadge.classList.add('hidden');
      }
    }
  },

  // Template
  render() {
    return `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-[#211E1B] border-b border-[#3A342E] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div class="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between">
          <!-- Logo -->
          <a href="#home" class="flex items-center gap-2" data-link>
            <div class="w-10 h-10 rounded-lg bg-[#B42318] flex items-center justify-center">
              <span class="material-symbols-outlined text-white">restaurant</span>
            </div>
            <span class="font-headline text-[#F7F3EC] font-semibold text-xl hidden sm:inline">Karachi Bites</span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-1">
            <a href="#home" class="nav-link px-4 py-2 rounded-lg text-[#B8B0A6] hover:text-[#F7F3EC] hover:bg-[#2A2622] transition-all font-label" data-link>Home</a>
            <a href="#menu" class="nav-link px-4 py-2 rounded-lg text-[#B8B0A6] hover:text-[#F7F3EC] hover:bg-[#2A2622] transition-all font-label" data-link>Menu</a>
            <a href="#cart" class="nav-link px-4 py-2 rounded-lg text-[#B8B0A6] hover:text-[#F7F3EC] hover:bg-[#2A2622] transition-all font-label relative" data-link>
              Cart
              <span id="cart-count-badge" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#B42318] text-white text-xs flex items-center justify-center hidden">0</span>
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-[#2A2622] text-[#B8B0A6]">
            <span class="material-symbols-outlined">menu</span>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden md:hidden bg-[#2A2622] border-t border-[#3A342E]">
          <div class="px-4 py-3 space-y-1">
            <a href="#home" class="block px-4 py-3 rounded-lg text-[#B8B0A6] hover:text-[#F7F3EC] hover:bg-[#2A2622] transition-all font-label" data-link>Home</a>
            <a href="#menu" class="block px-4 py-3 rounded-lg text-[#B8B0A6] hover:text-[#F7F3EC] hover:bg-[#2A2622] transition-all font-label" data-link>Menu</a>
            <a href="#cart" class="block px-4 py-3 rounded-lg text-[#B8B0A6] hover:text-[#F7F3EC] hover:bg-[#2A2622] transition-all font-label relative" data-link>
              Cart
              <span id="cart-count-badge" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#B42318] text-white text-xs flex items-center justify-center hidden">0</span>
            </a>
          </div>
        </div>
      </nav>
    `;
  },

  renderCartFloat() {
    const cart = cartStore.getCart();
    return `
      <div class="fixed bottom-0 left-0 right-0 z-40 bg-[#2A2622] border-t border-[#3A342E] p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button id="edit-cart-btn" class="flex items-center gap-2 bg-[#B42318] hover:bg-[#9E1C13] text-[#F7F3EC] px-4 py-2 rounded-lg font-label shadow-lg transition-all" data-link>
              <span class="material-symbols-outlined">edit</span>
              Edit Cart
            </button>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="text-xs text-[#B8B0A6] uppercase tracking-wider font-label">Total</div>
              <div class="font-price text-[#B42318]">${cartStore.formatPrice(cart.total)}</div>
            </div>
            <button id="checkout-btn" class="flex items-center gap-2 bg-[#2A2622] hover:bg-[#3A342E] border border-[#3A342E] text-[#F7F3EC] px-6 py-3 rounded-lg font-title shadow-lg transition-all">
              Proceed to Checkout
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    // Edit cart button
    const editCartBtn = document.getElementById('edit-cart-btn');
    if (editCartBtn) {
      editCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#menu';
        mobileMenu.classList.add('hidden');
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#checkout';
      });
    }

    // Cart badge update on link navigation
    document.querySelectorAll('[data-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        this.updateBadge();
      });
    });
  },
};

// Render navbar
window.renderNavbar = (containerId) => {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = navbar.render();
    navbar.init();
    navbar.bindEvents();
  }
};