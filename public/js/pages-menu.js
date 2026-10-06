const menuPage = {
  menuItems: [],
  itemsLoaded: false,
  searchQuery: '',
  activeCategory: 'All',

  async init() {
    await this.loadMenu();
    this.bindEvents();
  },

  async loadMenu() {
    if (this.itemsLoaded) return;
    try {
      const result = await api.getMenu();
      if (result.success) {
        this.menuItems = result.data;
      } else {
        console.error('Failed to load menu:', result.error);
        this.renderError('Failed to load menu: ' + result.error);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
      this.renderError('Error loading menu: ' + err.message);
    }
    this.itemsLoaded = true;
    this.render();
  },

  renderError(message) {
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <section class="pt-28 pb-24 px-6">
          <div class="max-w-3xl mx-auto text-center">
            <span class="material-symbols-outlined text-6xl text-[#B42318] mb-4">error</span>
            <h2 class="font-headline text-2xl text-[#F7F3EC] mb-2">Something went wrong</h2>
            <p class="text-[#B8B0A6]">${message}</p>
            <button onclick="window.location.hash = '#home'" class="mt-4 bg-[#B42318] hover:bg-[#9E1C13] text-white px-6 py-2 rounded-lg font-title" data-link>Go Home</button>
          </div>
        </section>
      `;
    }
  },

  bindEvents() {
    window.addEventListener('cartUpdated', () => {
      const badge = document.getElementById('cart-count-badge');
      if (badge) badge.textContent = cartStore.getCart().itemCount;
    });
  },

  render() {
    const container = document.getElementById('app');
    if (!container) return;

    const categories = ['All', ...new Set(this.menuItems.map(i => i.category))];
    const filteredItems = this.activeCategory === 'All'
      ? this.menuItems
      : this.menuItems.filter(i => i.category === this.activeCategory);

    const query = this.searchQuery.toLowerCase().trim();
    const searchedItems = query
      ? filteredItems.filter(i => i.name.toLowerCase().includes(query))
      : filteredItems;

    container.innerHTML = `
      <section class="pt-28 pb-24 px-6">
        <div class="max-w-7xl mx-auto">
          <h1 class="font-headline text-[#F7F3EC] text-3xl font-semibold mb-8">Menu</h1>

          <!-- Search & Filter -->
          <div class="mb-8 flex flex-col sm:flex-row gap-4">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B0A6]">search</span>
              <input id="menuSearch" type="text" placeholder="Search dishes..." value="${this.searchQuery}"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#211E1B] border border-[#3A342E] text-white placeholder-[#B8B0A6]/60 focus:outline-none focus:border-[#B42318] text-sm"/>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              ${categories.map(cat => `
                <button class="category-btn px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${this.activeCategory === cat ? 'bg-[#B42318] text-white' : 'bg-[#2A2622] text-[#B8B0A6] hover:bg-[#3A342E]'}" data-category="${cat}">${cat}</button>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="menuGrid"></div>
        </div>
      </section>
    `;
    this.renderItems(searchedItems);
    this.bindMenuEvents();
  },

  bindMenuEvents() {
    const searchInput = document.getElementById('menuSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.dataset.category;
        this.render();
      });
    });
  },

  renderItems(items) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    if (items.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-8 text-[#B8B0A6]">No menu items</div>';
      return;
    }
    grid.innerHTML = items.map(item => `
      <article class="bg-[#2A2622] border border-[#3A342E] rounded-xl p-5 hover:border-[#B42318]/50 transition-all">
        <h3 class="font-title text-[#F7F3EC] font-semibold">${item.name}</h3>
        ${item.category ? `<p class="text-[#B8B0A6] text-sm mb-2">${item.category}</p>` : ''}
        <div class="flex items-center justify-between mt-3">
          <span class="font-price text-[#B42318]">${cartStore.formatPrice(item.price)}</span>
          <button class="add-to-cart-btn bg-[#B42318] hover:bg-[#9E1C13] text-white text-sm px-4 py-2 rounded-lg transition-all" data-id="${item.id}" data-price="${item.price}" data-name="${item.name}" data-link>
            Add
          </button>
        </div>
      </article>
    `).join('');
    
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        cartStore.addItem({ id: id, price: parseInt(btn.dataset.price), name: btn.dataset.name, quantity: 1 });
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Added';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
          btn.innerHTML = 'Add';
          btn.classList.remove('bg-green-600');
          btn.classList.add('bg-[#B42318]');
        }, 1500);
      });
    });
    
    // Update cart badge
    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = cartStore.getCart().itemCount;
  },
};

window.addEventListener('DOMContentLoaded', () => menuPage.init());