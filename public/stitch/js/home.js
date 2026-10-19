(function () {
  'use strict';

  var menuItems = [];
  var activeCategory = 'All Dishes';
  var isLoading = false;
  var renderVersion = 0;

  var fallbackImages = {
    biryani: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=640&q=55&fm=webp',
    curry: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=640&q=55&fm=webp',
    bbq: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=55&fm=webp',
    roll: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=640&q=55&fm=webp',
    dessert: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=640&q=55&fm=webp',
    general: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=640&q=55&fm=webp'
  };

  var categoryPatterns = {
    'Karachi Biryani': /(biryani|pulao)/i,
    'Slow Nihari & Curries': /(nihari|curry|curries|karahi|haleem|stew|handi)/i,
    'Charcoal Grill & BBQ': /(bbq|barbecue|grill|kebab|kabab|tikka|boti|charcoal)/i,
    'Kabab Rolls': /(roll|kebab|kabab|wrap)/i,
    'Fresh Tandoor': /(tandoor|naan|roti|paratha|bread|kulcha)/i,
    'Beverages & Meetha': /(beverage|drink|juice|tea|coffee|dessert|meetha|mithai|gulab|kheer|sweet|shake|lassi)/i
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(value) {
    var amount = Number(value);
    if (!Number.isFinite(amount)) amount = 0;
    return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
  }

  function itemSearchText(item) {
    var tags = Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || '');
    return [item.name, item.category, tags].join(' ').toLowerCase();
  }

  function matchesActiveCategory(item) {
    if (activeCategory === 'All Dishes') return true;
    var pattern = categoryPatterns[activeCategory];
    return pattern ? pattern.test(itemSearchText(item)) : true;
  }

  function itemImage(item, index) {
    if (typeof item.image === 'string' && /^https:\/\/\S+$/i.test(item.image)) {
      return item.image;
    }
    var text = itemSearchText(item);
    if (/(biryani|pulao)/i.test(text)) return fallbackImages.biryani;
    if (/(nihari|curry|curries|karahi|haleem|stew|handi)/i.test(text)) return fallbackImages.curry;
    if (/(bbq|barbecue|grill|kebab|kabab|tikka|boti|charcoal)/i.test(text)) return fallbackImages.bbq;
    if (/(roll|wrap|paratha)/i.test(text)) return fallbackImages.roll;
    if (/(beverage|drink|juice|tea|coffee|dessert|meetha|mithai|gulab|kheer|sweet|shake|lassi)/i.test(text)) return fallbackImages.dessert;
    return [fallbackImages.biryani, fallbackImages.curry, fallbackImages.bbq, fallbackImages.general][index % 4];
  }

  function updateCartCount() {
    if (!window.cartStore) return;
    var cart = window.cartStore.getCart();
    var count = Number(cart.itemCount) || 0;
    var cartControls = Array.prototype.slice.call(document.querySelectorAll('header a, header button'));

    cartControls.forEach(function (control) {
      var icon = control.querySelector('[data-kb-icon="shopping-bag"]');
      if (!icon) return;

      var updated = false;
      Array.prototype.slice.call(control.childNodes).forEach(function (node) {
        if (node.nodeType === 3 && /cart/i.test(node.nodeValue || '')) {
          node.nodeValue = node.nodeValue.replace(/cart\s*\d*/i, 'Cart ' + count);
          updated = true;
        }
      });
      if (!updated && !control.querySelector('[data-kb-cart-count]')) {
        var badge = document.createElement('span');
        badge.setAttribute('data-kb-cart-count', 'true');
        badge.className = 'ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#B42318] px-1.5 py-0.5 text-xs text-white';
        badge.textContent = String(count);
        control.appendChild(badge);
      } else {
        var existingBadge = control.querySelector('[data-kb-cart-count]');
        if (existingBadge) existingBadge.textContent = String(count);
      }
      control.setAttribute('aria-label', 'Shopping cart, ' + count + ' item' + (count === 1 ? '' : 's'));
    });
  }

  function syncCategoryTabs() {
    document.querySelectorAll('.menu-tab-btn').forEach(function (button) {
      var selected = (button.textContent || '').replace(/\\s+/g, ' ').trim() === activeCategory;
      var stateClasses = [
        'bg-[#2A2622]',
        'text-[#B42318]',
        'border',
        'border-[#3A342E]',
        'shadow-sm'
      ];
      stateClasses.forEach(function (className) {
        button.classList.toggle(className, selected);
      });
      button.classList.toggle('text-[#B8B0A6]', !selected);

      var oldDot = button.querySelector('span.rounded-full');
      if (selected && !oldDot) {
        var dot = document.createElement('span');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-[#B42318] inline-block mr-1.5';
        dot.setAttribute('aria-hidden', 'true');
        button.prepend(dot);
      } else if (!selected && oldDot) {
        oldDot.remove();
      }
    });
  }

  function renderMenuItem(item, index) {
    var id = String(item.id);
    var name = String(item.name);
    var category = String(item.category || 'Karachi Kitchen');
    var description = String(item.description || '').trim() || 'Prepared fresh to order by our Karachi Bites kitchen.';
    var image = itemImage(item, index);

    return '<article class="md:col-span-4 bg-[#2A2622] border border-[#3A342E] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col h-full">' +
      '<div class="relative rounded-xl overflow-hidden aspect-[16/10] bg-[#211E1B] mb-4">' +
        '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(name) + '" class="w-full h-full object-cover" loading="lazy" decoding="async" width="640" height="400" />' +
        '<span class="absolute top-3 left-3 rounded bg-[#211E1B]/90 border border-[#3A342E] px-2 py-1 text-xs font-semibold text-[#F7F3EC]">' + escapeHtml(category) + '</span>' +
      '</div>' +
      '<div class="flex flex-1 flex-col">' +
        '<h3 class="font-headline-sm text-lg font-semibold text-[#F7F3EC] mb-2">' + escapeHtml(name) + '</h3>' +
        '<p class="font-body-sm text-sm leading-relaxed text-[#B8B0A6]">' + escapeHtml(description) + '</p>' +
        '<div class="pt-5 mt-auto flex items-center justify-between gap-3">' +
          '<span class="text-lg font-semibold text-[#B42318]">' + escapeHtml(formatPrice(item.price)) + '</span>' +
          '<button type="button" data-kb-live-cart="true" data-menu-id="' + escapeHtml(id) + '" class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#B42318] px-4 py-2 text-sm font-semibold text-white" aria-label="Add ' + escapeHtml(name) + ' to cart">' +
            '<svg class="kb-add-cart-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M18 2v6M15 5h6"/></svg><span>Add to Cart</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderMenu() {
    var grid = document.getElementById('kb-live-menu');
    if (!grid) return;

    var version = ++renderVersion;
    var items = menuItems.filter(matchesActiveCategory).filter(function (item) {
      return item && item.id != null && Number.isFinite(Number(item.price)) && String(item.name || '').trim();
    });
    grid.setAttribute('aria-busy', 'true');

    if (!items.length) {
      grid.innerHTML = '<div class="md:col-span-12 rounded-xl border border-[#3A342E] bg-[#211E1B] px-6 py-10 text-center text-[#B8B0A6]">No available dishes match this category yet. Choose another category to keep browsing.</div>';
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    var cursor = 0;
    var chunkSize = 4;
    function appendChunk() {
      if (version !== renderVersion) return;
      var chunk = items.slice(cursor, cursor + chunkSize);
      var markup = chunk.map(function (item, index) {
        return renderMenuItem(item, cursor + index);
      }).join('');
      if (cursor === 0) grid.innerHTML = markup;
      else grid.insertAdjacentHTML('beforeend', markup);
      cursor += chunk.length;
      if (cursor < items.length) {
        window.requestAnimationFrame(appendChunk);
      } else {
        grid.setAttribute('aria-busy', 'false');
      }
    }
    appendChunk();
  }

  function showCartToast(item) {
    var toast = document.getElementById('kb-cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kb-cart-toast';
      toast.className = 'fixed bottom-6 right-4 z-50 max-w-sm translate-y-4 rounded-xl border border-[#3A342E] bg-[#2A2622] px-4 py-3 text-sm text-[#F7F3EC] opacity-0 shadow-2xl transition-all duration-300 md:right-6';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = String(item.name) + ' added to cart · ' + formatPrice(item.price);
    requestAnimationFrame(function () {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });
    window.setTimeout(function () {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-4', 'opacity-0');
    }, 2400);
  }

  async function loadMenu() {
    if (isLoading) return;
    isLoading = true;
    var grid = document.getElementById('kb-live-menu');
    if (grid) {
      grid.setAttribute('aria-busy', 'true');
      grid.innerHTML = '<div class="md:col-span-12 rounded-xl border border-[#3A342E] bg-[#211E1B] px-6 py-10 text-center text-[#B8B0A6]">Loading available dishes…</div>';
    }

    try {
      if (!window.api || typeof window.api.getMenu !== 'function' || !window.cartStore) {
        throw new Error('The ordering interface could not initialize. Please refresh and try again.');
      }
      var result = await window.api.getMenu();
      if (!result || !result.success || !Array.isArray(result.data)) {
        throw new Error((result && result.error) || 'The menu is temporarily unavailable.');
      }
      menuItems = result.data.filter(function (item) {
        return item && item.available !== false && item.available !== 0 && item.available !== 'false';
      });
      window.cartStore.setCart(window.cartStore.getCart());
      updateCartCount();
      syncCategoryTabs();
      renderMenu();
    } catch (error) {
      if (grid) {
        grid.setAttribute('aria-busy', 'false');
        grid.innerHTML = '<div class="md:col-span-12 rounded-xl border border-[#3A342E] bg-[#211E1B] px-6 py-10 text-center">' +
          '<p class="mb-4 text-[#B8B0A6]">The live menu could not be loaded. Please try again.</p>' +
          '<button type="button" data-kb-retry="true" class="rounded-lg bg-[#B42318] px-4 py-2 font-semibold text-white hover:bg-[#C93627]">Retry</button>' +
          '</div>';
      }
      console.error('Unable to load the live Karachi Bites menu:', error);
    } finally {
      isLoading = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('kb-live-menu');

    if (grid) {
      grid.addEventListener('click', function (event) {
        if (event.target.closest('[data-kb-retry]')) {
          loadMenu();
          return;
        }
        var button = event.target.closest('[data-kb-live-cart]');
        if (!button || !grid.contains(button)) return;
        var item = menuItems.find(function (candidate) {
          return String(candidate.id) === button.getAttribute('data-menu-id');
        });
        if (!item || !window.cartStore) return;

        window.cartStore.addItem({
          id: Number(item.id),
          name: String(item.name),
          price: Number(item.price),
          quantity: 1
        });
        updateCartCount();

        var label = button.querySelector('span:last-child');
        var original = label ? label.textContent : 'Add to Cart';
        if (label) label.textContent = 'Added';
        showCartToast(item);
        window.setTimeout(function () {
          if (label) label.textContent = original;
        }, 1400);
      });
    }

    document.querySelectorAll('.menu-tab-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        activeCategory = (button.textContent || '').replace(/\s+/g, ' ').trim();
        syncCategoryTabs();
        renderMenu();
      });
    });

    window.addEventListener('cartUpdated', updateCartCount);
    loadMenu();
  });
})();