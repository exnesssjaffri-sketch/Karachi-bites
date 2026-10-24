const menuPage = {
  menuItems: [],
  itemsLoaded: false,
  loadError: null,
  searchQuery: "",
  activeCategory: "All",
  onlyVegetarian: false,
  onlySpicy: false,
  maxPrice: "",

  async init() {
    const container = document.getElementById("app");
    if (!container) {
      console.error("menuPage.init: No #app container found");
      return;
    }
    container.setAttribute("aria-busy", "true");
    container.innerHTML = '<div class="flex min-h-[60vh] flex-col items-center justify-center"><div class="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#B42318] border-t-transparent"></div><p class="text-sm text-[#B8B0A6]">Loading menu...</p></div>';

    try {
      this.loadError = null;
      await this.loadMenu();

      const queryString = window.location.hash.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const requestedCategory = params.get("category");

      if (requestedCategory) {
        const exact = this.menuItems.some((item) => item.category === requestedCategory);
        this.activeCategory = exact ? requestedCategory : requestedCategory;
      }

      this.render();
    } catch (error) {
      console.error("menuPage.init error:", error);
      this.loadError = error.message || "Failed to initialize menu page";
      this.render();
    } finally {
      if (container) {
        container.setAttribute("aria-busy", "false");
      }
    }
  },

  async loadMenu() {
    if (this.itemsLoaded) return;
    try {
      if (!window.api || typeof window.api.getMenu !== "function") {
        throw new Error("Menu service is not available.");
      }
      const result = await window.api.getMenu();
      // API returns raw array, not { success, data }
      const data = Array.isArray(result) ? result : (result && result.data ? result.data : []);
      if (!Array.isArray(data)) {
        throw new Error("Invalid menu response format");
      }
      this.menuItems = data.filter((item) =>
        item && item.available !== false && item.available !== 0 && item.available !== "false"
      );
      this.itemsLoaded = true;
      console.log("menuPage loaded:", this.menuItems.length, "items");
    } catch (error) {
      console.error("Unable to load menu:", error);
      this.loadError = error.message || "The live menu could not be loaded. Check your connections and try again.";
    }
  },

  escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  tagsText(item) {
    const tags = Array.isArray(item.tags) ? item.tags.join(" ") :
      (typeof item.tags === "string" ? item.tags : "");
    return [item.name, item.category, tags, item.description || ""].join(" ").toLowerCase();
  },

  isVegetarian(item) {
    const text = this.tagsText(item);
    if (/\b(non[\s-]?veg|chicken|beef|mutton|lamb|fish|prawn|seafood|meat|keema)\b/i.test(text)) return false;
    return /\b(veg|vegetarian|vegan)\b/i.test(text);
  },

  isSpicy(item) {
    const tags = Array.isArray(item.tags) ? item.tags.join(" ") :
      (typeof item.tags === "string" ? item.tags : "");
    return /\b(spicy|hot|fiery|chilli|chili|extra[-\s]?hot)\b/i.test(tags) ||
      /\b(spicy|fiery|extra[-\s]?hot)\b/i.test(String(item.name || ""));
  },

  categoryMatches(item) {
    if (!this.activeCategory || this.activeCategory === "All") return true;
    const categories = this.menuItems.map((item) => item.category).filter(Boolean);
    if (categories.includes(this.activeCategory)) return item.category === this.activeCategory;

    const patterns = {
      "Biryani & Pulao": /(biryani|pulao|rice)/i,
      "Karachi Biryani": /(biryani|pulao|rice)/i,
      "Slow Nihari & Curries": /(nihari|curry|curries|karahi|haleem|stew|handi)/i,
      "Nihari & Haleem": /(nihari|haleem|stew)/i,
      "Charcoal Grill & BBQ": /(bbq|barbecue|grill|kebab|kabab|tikka|boti|charcoal)/i,
      "Charcoal BBQ & Kebabs": /(bbq|barbecue|grill|kebab|kabab|tikka|boti|charcoal)/i,
      "Kabab Rolls": /(roll|wrap|kebab|kabab)/i,
      "Paratha Rolls": /(roll|wrap|paratha)/i,
      "Fresh Tandoor": /(tandoor|naan|roti|paratha|bread|kulcha)/i,
      "Desserts & Beverages": /(beverage|drink|juice|tea|coffee|dessert|meetha|mithai|gulab|kheer|sweet|shake|lassi)/i
    };
    const pattern = patterns[this.activeCategory];
    return pattern ? pattern.test(this.tagsText(item)) : true;
  },

  getFilteredItems() {
    const query = this.searchQuery.trim().toLowerCase();
    const max = this.maxPrice === "" ? null : Number(this.maxPrice);

    return this.menuItems.filter((item) => {
      const searchMatch = !query || this.tagsText(item).includes(query);
      const categoryMatch = this.categoryMatches(item);
      const vegMatch = !this.onlyVegetarian || this.isVegetarian(item);
      const spicyMatch = !this.onlySpicy || this.isSpicy(item);
      const priceMatch = max === null || (Number.isFinite(max) && Number(item.price) <= max);
      return searchMatch && categoryMatch && vegMatch && spicyMatch && priceMatch;
    });
  },

  imageFor(item, index) {
    if (typeof item.image === "string" && /^https:\/\/\S+$/i.test(item.image)) return item.image;
    const text = this.tagsText(item);
    if (/(biryani|pulao|rice)/i.test(text)) return "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80";
    if (/(nihari|curry|curries|karahi|haleem|stew|handi)/i.test(text)) return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80";
    if (/(bbq|barbecue|grill|kebab|kabab|tikka|boti|charcoal)/i.test(text)) return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80";
    if (/(roll|wrap|paratha)/i.test(text)) return "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80";
    if (/(beverage|drink|juice|tea|coffee|dessert|meetha|mithai|gulab|kheer|sweet|shake|lassi)/i.test(text)) return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80";
    return index % 2 === 0
      ? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80"
      : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80";
  },

render() {
    const container = document.getElementById("app");
    if (!container) return;

    const categories = ["All Dishes", ...new Set(this.menuItems.map((item) => item.category).filter(Boolean))];
    const safeCategories = categories.map((cat) => String(cat));
    const cartCount = window.cartStore ? window.cartStore.getCart().itemCount : 0;

    container.innerHTML =
      '<div class="relative w-full overflow-hidden bg-[#211E1B] border-b border-[#3A342E] pb-space-lg">' +
        '<div class="max-w-7xl mx-auto px-margin-desktop pt-space-xl">' +
          '<div class="flex items-center gap-space-xs text-[#B8B0A6] font-label-sm text-label-sm mb-space-sm uppercase tracking-wider">' +
            '<span class="hover:text-[#F7F3EC] cursor-pointer transition-colors">Kitchen Dispatch</span>' +
            '<span class="text-[#3A342E]">/</span>' +
            '<span class="text-[#B42318] font-semibold">Online Dining Ledger</span>' +
            '<span class="text-[#3A342E]">/</span>' +
            '<span>Order Stream 1952</span>' +
          '</div>' +
          '<div class="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">' +
            '<div class="max-w-3xl">' +
              '<div class="inline-flex items-center gap-space-xs px-2.5 py-1 rounded bg-[#2A2622] border border-[#3A342E] text-[#B8B0A6] text-label-sm font-label-sm uppercase tracking-wider mb-space-sm">' +
                '<span class="w-1.5 h-1.5 rounded-full bg-[#B42318] animate-pulse"></span>' +
                '<span>Kitchen Active — Dispatching Now</span>' +
              '</div>' +
              '<h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-[#F7F3EC] tracking-tight mb-space-xs">Heritage Dining Ledger</h1>' +
              '<p class="font-body-md text-body-md text-[#B8B0A6] max-w-2xl">Authentic Burns Road recipes slow-cooked overnight. Select your dishes below to build your dispatch order.</p>' +
            '</div>' +
            '<a href="#cart" data-link class="inline-flex items-center justify-center gap-space-xs px-5 py-2.5 rounded-lg bg-[#B42318] hover:bg-[#C93627] text-white font-title-md text-title-md font-semibold shadow-md transition-all shrink-0">' +
              '<span class="material-symbols-outlined text-[20px]">shopping_bag</span>' +
              '<span>View Cart</span>' +
              '<span id="menuCartCount" class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/20 text-white font-label-sm text-label-sm font-semibold">' + cartCount + '</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<section class="w-full bg-[#181614] px-margin-desktop py-space-xl">' +
        '<div class="max-w-7xl mx-auto">' +
          (this.loadError ? '<div role="alert" class="rounded-xl border border-[#3A342E] bg-[#211E1B] p-space-lg text-center mb-space-lg"><p class="mb-4 font-body-md text-body-md text-[#B8B0A6]">' + this.escapeHtml(this.loadError) + '</p><button type="button" id="retryMenu" class="rounded-lg bg-[#B42318] px-4 py-2 font-label-md text-label-md font-semibold text-white hover:bg-[#C93627] transition-colors">Try again</button></div>' :
          '<div class="mb-space-lg rounded-2xl border border-[#3A342E] bg-[#211E1B] p-space-lg">' +
            '<label for="menuSearch" class="mb-2 block font-label-sm text-label-sm text-[#B8B0A6] uppercase tracking-wider">Search the Ledger</label>' +
            '<div class="relative"><span class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B0A6]" aria-hidden="true">search</span><input id="menuSearch" type="search" value="' + this.escapeHtml(this.searchQuery) + '" placeholder="Search biryani, nihari, BBQ..." class="w-full rounded-lg border border-[#3A342E] bg-[#181614] py-3 pl-10 pr-4 font-body-md text-[#F7F3EC] placeholder-[#B8B0A6]/60 outline-none focus:border-[#B42318]" autocomplete="off" /></div>' +
            '<div class="mt-4 flex flex-wrap gap-2" id="categoryTabGroup" aria-label="Menu categories">' +
              safeCategories.map((cat) => '<button type="button" class="kb-category-btn menu-tab-btn rounded-full border px-4 py-2 font-label-md text-label-md transition ' + (this.activeCategory === cat ? 'border-[#B42318] bg-[#B42318] text-white font-semibold' : 'border-[#3A342E] bg-[#2A2622] text-[#B8B0A6] hover:border-[#B42318] hover:text-[#F7F3EC]') + '" data-category="' + this.escapeHtml(cat) + '" aria-pressed="' + String(this.activeCategory === cat) + '">' + this.escapeHtml(cat) + '</button>').join("") +
            '</div>' +
            '<div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">' +
              '<label class="flex min-h-12 items-center gap-3 rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2.5 font-body-md text-[#F7F3EC]"><input type="checkbox" id="filterVeg" class="h-4 w-4 accent-[#B42318]" ' + (this.onlyVegetarian ? 'checked' : '') + ' /><span>Vegetarian only</span></label>' +
              '<label class="flex min-h-12 items-center gap-3 rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2.5 font-body-md text-[#F7F3EC]"><input type="checkbox" id="filterSpicy" class="h-4 w-4 accent-[#B42318]" ' + (this.onlySpicy ? 'checked' : '') + ' /><span>Spicy dishes</span></label>' +
              '<label class="flex min-h-12 items-center gap-3 rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2.5 font-body-md text-[#F7F3EC]"><span class="shrink-0 text-[#B8B0A6]">Max Rs.</span><input type="number" min="0" step="50" id="filterMaxPrice" value="' + this.escapeHtml(this.maxPrice) + '" placeholder="Any price" inputmode="numeric" class="min-w-0 w-full rounded-md border border-[#3A342E] bg-[#211E1B] px-3 py-2 text-[#F7F3EC] outline-none focus:border-[#B42318]" /></label>' +
            '</div>' +
          '</div>' +
          '<div class="mb-4 flex items-center justify-between gap-3"><p id="menuResultCount" class="font-body-sm text-body-sm text-[#B8B0A6]" aria-live="polite"></p><button id="resetMenuFilters" type="button" class="rounded-lg px-3 py-2 font-label-md text-label-md text-[#ffb4a8] hover:bg-[#2A2622] transition-colors">Clear filters</button></div>' +
          '<div id="menuGrid" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-live="polite"></div>') +
        '</div>' +
      '</section>';

    if (this.loadError) {
      document.getElementById("retryMenu")?.addEventListener("click", async () => {
        this.itemsLoaded = false;
        this.loadError = null;
        await this.loadMenu();
        this.render();
      });
      return;
    }

    document.getElementById("menuSearch")?.addEventListener("input", (event) => {
      this.searchQuery = event.target.value;
      this.renderItems(this.getFilteredItems());
    });
    document.getElementById("filterVeg")?.addEventListener("change", (event) => {
      this.onlyVegetarian = event.target.checked;
      this.renderItems(this.getFilteredItems());
    });
    document.getElementById("filterSpicy")?.addEventListener("change", (event) => {
      this.onlySpicy = event.target.checked;
      this.renderItems(this.getFilteredItems());
    });
    document.getElementById("filterMaxPrice")?.addEventListener("input", (event) => {
      this.maxPrice = event.target.value;
      this.renderItems(this.getFilteredItems());
    });
    document.getElementById("resetMenuFilters")?.addEventListener("click", () => {
      this.searchQuery = "";
      this.activeCategory = "All";
      this.onlyVegetarian = false;
      this.onlySpicy = false;
      this.maxPrice = "";
      this.render();
    });
    container.querySelectorAll(".kb-category-btn").forEach((button) => {
      button.addEventListener("click", () => {
        this.activeCategory = button.getAttribute("data-category") || "All";
        this.render();
      });
    });
    this.renderItems(this.getFilteredItems());
  },

  renderItems(items) {
    const grid = document.getElementById("menuGrid");
    const count = document.getElementById("menuResultCount");
    const cartCount = document.getElementById("menuCartCount");
    if (!grid) return;
    if (count) count.textContent = items.length + " dish" + (items.length === 1 ? "" : "es") + " available";
    if (cartCount && window.cartStore) cartCount.textContent = String(window.cartStore.getCart().itemCount);

    if (!items.length) {
      grid.innerHTML = '<div class="col-span-full rounded-xl border border-[#3A342E] bg-[#211E1B] px-6 py-12 text-center"><span class="material-symbols-outlined mb-3 text-4xl text-[#B42318]" aria-hidden="true">search_off</span><h2 class="mb-2 font-headline-sm text-headline-sm text-[#F7F3EC]">No dishes found</h2><p class="font-body-sm text-body-sm text-[#B8B0A6]">Try another category or relax one of your filters.</p></div>';
      return;
    }

    grid.innerHTML = items.map((item, index) => {
      const name = String(item.name || "Menu item");
      const category = String(item.category || "Karachi Kitchen");
      const description = String(item.description || "").trim() || "Prepared fresh to order by our Karachi Bites kitchen.";
      const image = this.imageFor(item, index);
      const tags = Array.isArray(item.tags) ? item.tags.join(", ") : String(item.tags || "");
      return '<article class="food-item-card flex flex-col bg-[#2A2622] border border-[#3A342E] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] overflow-hidden hover:border-[#B42318]/50 transition-all duration-200">' +
        '<div class="relative w-full h-52 overflow-hidden bg-[#211E1B]"><img src="' + this.escapeHtml(image) + '" alt="' + this.escapeHtml(name) + '" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" decoding="async" /><span class="absolute left-3 top-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#211E1B]/90 backdrop-blur-sm text-[#F7F3EC] border border-[#3A342E] font-label-sm text-label-sm font-semibold shadow-xs">' + this.escapeHtml(category) + '</span></div>' +
        '<div class="p-space-md flex flex-col flex-1 justify-between gap-space-md">' +
          '<div class="flex flex-col gap-1">' +
            '<div class="flex items-baseline justify-between gap-2">' +
              '<h3 class="font-headline-sm text-headline-sm text-[#F7F3EC] font-semibold">' + this.escapeHtml(name) + '</h3>' +
              '<span class="font-price-display text-price-display text-[#B42318] font-bold whitespace-nowrap">' + this.escapeHtml(window.cartStore.formatPrice(Number(item.price) || 0)) + '</span>' +
            '</div>' +
            '<p class="font-body-md text-body-md text-[#B8B0A6] line-clamp-2 mt-1">' + this.escapeHtml(description) + '</p>' +
          '</div>' +
          '<div class="pt-space-sm flex items-center justify-between">' +
            '<div class="flex items-center gap-2">' +
              '<span class="w-5 h-5 rounded flex items-center justify-center bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] text-[11px] font-semibold">H</span>' +
              '<span class="font-label-sm text-label-sm text-[#B8B0A6]">Heritage</span>' +
            '</div>' +
            '<button type="button" class="add-to-cart-btn px-4 py-2 rounded-lg bg-[#211E1B] hover:bg-[#342E28] border border-[#3A342E] text-[#F7F3EC] font-label-md text-label-md font-semibold transition-colors flex items-center gap-1" data-menu-id="' + this.escapeHtml(item.id) + '" data-id="' + this.escapeHtml(item.id) + '" data-price="' + Number(item.price) + '" data-title="' + this.escapeHtml(name) + '"><span class="material-symbols-outlined text-[18px]">add</span> Add to Cart</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");

    grid.querySelectorAll(".kb-add-to-cart").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-menu-id");
        const item = this.menuItems.find((candidate) => String(candidate.id) === id);
        if (!item || !window.cartStore) return;
        window.cartStore.addItem({
          id: Number(item.id),
          name: String(item.name),
          price: Number(item.price),
          quantity: 1
        });
        if (cartCount) cartCount.textContent = String(window.cartStore.getCart().itemCount);
        button.innerHTML = '<span class="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>Added';
        window.setTimeout(() => {
          if (button.isConnected) button.innerHTML = '<span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>Add';
        }, 1200);
      });
    });
  },
};
