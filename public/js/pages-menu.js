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
    const queryString = window.location.hash.split("?")[1] || "";
    const params = new URLSearchParams(queryString);
    const requestedCategory = params.get("category");
    this.loadError = null;
    await this.loadMenu();

    if (requestedCategory) {
      const exact = this.menuItems.some((item) => item.category === requestedCategory);
      this.activeCategory = exact ? requestedCategory : requestedCategory;
    }
    this.render();
  },

  async loadMenu() {
    if (this.itemsLoaded) return;
    try {
      if (!window.api || typeof window.api.getMenu !== "function") {
        throw new Error("Menu service is not available.");
      }
      const result = await window.api.getMenu();
      if (!result || !result.success || !Array.isArray(result.data)) {
        throw new Error((result && result.error) || "The menu is temporarily unavailable.");
      }
      this.menuItems = result.data.filter((item) =>
        item && item.available !== false && item.available !== 0 && item.available !== "false"
      );
      this.itemsLoaded = true;
    } catch (error) {
      console.error("Unable to load menu:", error);
      this.loadError = "The live menu could not be loaded. Check your connection and try again.";
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

    const categories = ["All", ...new Set(this.menuItems.map((item) => item.category).filter(Boolean))];
    const safeCategories = categories.map((cat) => String(cat));
    container.innerHTML =
      '<section class="px-4 pb-20 pt-28 sm:px-6">' +
        '<div class="mx-auto max-w-7xl">' +
          '<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">' +
            '<div><span class="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#3A342E] bg-[#211E1B] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#B42318]">Burns Road Kitchen</span>' +
            '<h1 class="font-headline text-3xl font-semibold text-[#F7F3EC] sm:text-4xl">Our Menu</h1>' +
            '<p class="mt-2 max-w-2xl text-sm leading-6 text-[#B8B0A6]">Freshly prepared Karachi favourites. Search dishes and combine filters to find your meal.</p></div>' +
            '<a href="#cart" data-link class="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-[#3A342E] bg-[#2A2622] px-4 py-2.5 text-sm font-semibold text-[#F7F3EC] transition hover:border-[#B42318] sm:self-auto"><span class="material-symbols-outlined" aria-hidden="true">shopping_bag</span>View Cart <span id="menuCartCount" class="rounded-full bg-[#B42318] px-2 py-0.5 text-xs text-white">0</span></a>' +
          '</div>' +
          (this.loadError ? '<div role="alert" class="rounded-xl border border-[#3A342E] bg-[#211E1B] p-6 text-center"><p class="mb-4 text-[#B8B0A6]">' + this.escapeHtml(this.loadError) + '</p><button type="button" id="retryMenu" class="rounded-lg bg-[#B42318] px-4 py-2 font-semibold text-white hover:bg-[#C93627]">Try again</button></div>' :
          '<div class="mb-6 rounded-2xl border border-[#3A342E] bg-[#211E1B] p-4 sm:p-5">' +
            '<label for="menuSearch" class="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#B8B0A6]">Search menu</label>' +
            '<div class="relative"><span class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B8B0A6]" aria-hidden="true">search</span><input id="menuSearch" type="search" value="' + this.escapeHtml(this.searchQuery) + '" placeholder="Search biryani, nihari, BBQ..." class="w-full rounded-lg border border-[#3A342E] bg-[#181614] py-3 pl-10 pr-4 text-[#F7F3EC] placeholder-[#B8B0A6]/60 outline-none focus:border-[#B42318]" autocomplete="off" /></div>' +
            '<div class="mt-4 flex flex-wrap gap-2" aria-label="Menu categories">' +
              safeCategories.map((cat) => '<button type="button" class="kb-category-btn rounded-full border px-4 py-2 text-sm font-medium transition ' + (this.activeCategory === cat ? 'border-[#B42318] bg-[#B42318] text-white' : 'border-[#3A342E] bg-[#2A2622] text-[#B8B0A6] hover:border-[#B42318] hover:text-[#F7F3EC]') + '" data-category="' + this.escapeHtml(cat) + '" aria-pressed="' + String(this.activeCategory === cat) + '">' + this.escapeHtml(cat) + '</button>').join("") +
            '</div>' +
            '<div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">' +
              '<label class="flex min-h-12 items-center gap-3 rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2.5 text-sm text-[#F7F3EC]"><input type="checkbox" id="filterVeg" class="h-4 w-4 accent-[#B42318]" ' + (this.onlyVegetarian ? 'checked' : '') + ' /><span>Vegetarian only</span></label>' +
              '<label class="flex min-h-12 items-center gap-3 rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2.5 text-sm text-[#F7F3EC]"><input type="checkbox" id="filterSpicy" class="h-4 w-4 accent-[#B42318]" ' + (this.onlySpicy ? 'checked' : '') + ' /><span>Spicy dishes</span></label>' +
              '<label class="flex min-h-12 items-center gap-3 rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2.5 text-sm text-[#F7F3EC]"><span class="shrink-0 text-[#B8B0A6]">Max Rs.</span><input type="number" min="0" step="50" id="filterMaxPrice" value="' + this.escapeHtml(this.maxPrice) + '" placeholder="Any price" inputmode="numeric" class="min-w-0 w-full rounded-md border border-[#3A342E] bg-[#211E1B] px-3 py-2 text-[#F7F3EC] outline-none focus:border-[#B42318]" /></label>' +
            '</div>' +
          '</div>' +
          '<div class="mb-4 flex items-center justify-between gap-3"><p id="menuResultCount" class="text-sm text-[#B8B0A6]" aria-live="polite"></p><button id="resetMenuFilters" type="button" class="rounded-lg px-3 py-2 text-sm font-semibold text-[#ffb4a8] hover:bg-[#2A2622]">Clear filters</button></div>' +
          '<div id="menuGrid" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite"></div>') +
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
      grid.innerHTML = '<div class="col-span-full rounded-xl border border-[#3A342E] bg-[#211E1B] px-6 py-12 text-center"><span class="material-symbols-outlined mb-3 text-4xl text-[#B42318]" aria-hidden="true">search_off</span><h2 class="mb-2 text-lg font-semibold text-[#F7F3EC]">No dishes found</h2><p class="text-sm text-[#B8B0A6]">Try another category or relax one of your filters.</p></div>';
      return;
    }

    grid.innerHTML = items.map((item, index) => {
      const name = String(item.name || "Menu item");
      const category = String(item.category || "Karachi Kitchen");
      const description = String(item.description || "").trim() || "Prepared fresh to order by our Karachi Bites kitchen.";
      const image = this.imageFor(item, index);
      const tags = Array.isArray(item.tags) ? item.tags.join(", ") : String(item.tags || "");
      return '<article class="flex h-full flex-col overflow-hidden rounded-2xl border border-[#3A342E] bg-[#2A2622] transition hover:border-[#B42318]/60">' +
        '<div class="relative aspect-[16/10] overflow-hidden bg-[#181614]"><img src="' + this.escapeHtml(image) + '" alt="' + this.escapeHtml(name) + '" class="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" decoding="async" /><span class="absolute left-3 top-3 rounded bg-[#181614]/90 px-2.5 py-1 text-xs font-semibold text-[#F7F3EC]">' + this.escapeHtml(category) + '</span></div>' +
        '<div class="flex flex-1 flex-col p-5"><h2 class="mb-2 text-lg font-semibold text-[#F7F3EC]">' + this.escapeHtml(name) + '</h2>' +
        '<p class="mb-3 text-sm leading-6 text-[#B8B0A6]">' + this.escapeHtml(description) + '</p>' +
        (tags ? '<p class="mb-4 text-xs text-[#B8B0A6]/80">' + this.escapeHtml(tags) + '</p>' : '<div class="mb-4"></div>') +
        '<div class="mt-auto flex items-center justify-between gap-3"><span class="text-lg font-semibold text-[#B42318]">' + this.escapeHtml(window.cartStore.formatPrice(Number(item.price) || 0)) + '</span>' +
        '<button type="button" class="kb-add-to-cart inline-flex items-center gap-1.5 rounded-lg bg-[#B42318] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C93627] active:scale-95" data-menu-id="' + this.escapeHtml(item.id) + '"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>Add</button></div></div></article>';
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
