(() => {
  const destinations = {
    home: "/",
    menu: "/app.html#menu",
    "order-now": "/app.html#menu",
    cart: "/app.html#cart",
    "track-order": "/app.html#tracking",
    "order-confirmation": "/app.html#menu",
    "staff-portal": "/admin",
    login: "/admin"
  };

  // Load a shared, production-served responsive layer without duplicating CSS across Stitch exports.
  if (!document.querySelector('link[data-kb-responsive]')) {
    const responsiveStyles = document.createElement("link");
    responsiveStyles.rel = "stylesheet";
    responsiveStyles.href = "/responsive.css";
    responsiveStyles.setAttribute("data-kb-responsive", "true");
    document.head.appendChild(responsiveStyles);
  }

  function enhanceStaticMobileNavigation() {
    const header = document.querySelector("header");
    if (!header) return;
    const inner = header.firstElementChild;
    const nav = inner && inner.querySelector(":scope > nav");
    if (!inner || !nav) return;

    header.classList.add("kb-stitch-header");
    inner.classList.add("kb-stitch-inner");
    const actions = nav.nextElementSibling;
    if (!actions) return;

    const orderNow = actions.querySelector('[data-path="order-now"]') ||
      Array.from(actions.querySelectorAll("a")).find(a => /order now/i.test(a.textContent || ""));
    if (orderNow) orderNow.classList.add("kb-order-now");

    Array.from(actions.children).forEach(element => {
      if (element !== orderNow) element.classList.add("kb-mobile-hide");
    });

    let panel = header.querySelector("#kb-mobile-nav-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "kb-mobile-nav-panel";
      panel.setAttribute("data-open", "false");
      panel.setAttribute("aria-label", "Mobile navigation");
      const links = [...nav.querySelectorAll("a[data-path]"),
        ...header.querySelectorAll('a[data-path="staff-portal"], a[data-path="login"]')];
      const seen = new Set();
      links.forEach(source => {
        const key = source.getAttribute("data-path");
        if (!key || !destinations[key] || seen.has(key) || key === "order-now") return;
        seen.add(key);
        const link = document.createElement("a");
        link.href = source.getAttribute("href") || destinations[key];
        link.setAttribute("data-path", key);
        link.textContent = (source.textContent || "").replace(/\\s+/g, " ").trim();
        if (source.getAttribute("aria-current") === "page") link.setAttribute("aria-current", "page");
        panel.appendChild(link);
      });
      [
        ["home", "Home"],
        ["menu", "Menu"],
        ["cart", "Cart"],
        ["track-order", "Track Order"]
      ].forEach(([key, label]) => {
        if (seen.has(key)) return;
        seen.add(key);
        const link = document.createElement("a");
        link.href = destinations[key];
        link.setAttribute("data-path", key);
        link.textContent = label;
        panel.appendChild(link);
      });
      if (orderNow) {
        const cta = document.createElement("a");
        cta.href = orderNow.getAttribute("href") || destinations["order-now"];
        cta.setAttribute("data-path", "order-now");
        cta.className = "kb-mobile-nav-cta";
        cta.textContent = "Order Now";
        panel.appendChild(cta);
      }
      header.appendChild(panel);
    }

    let toggle = actions.querySelector("#kbMobileMenuToggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.id = "kbMobileMenuToggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Open navigation menu");
      toggle.setAttribute("aria-controls", "kb-mobile-nav-panel");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu</span>';
      actions.appendChild(toggle);
      toggle.addEventListener("click", () => {
        const open = panel.getAttribute("data-open") !== "true";
        panel.setAttribute("data-open", String(open));
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
        toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">' + (open ? "close" : "menu") + '</span>';
      });
    }
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        panel.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
        toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu</span>';
      }
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target)) {
        panel.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");
        toggle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu</span>';
      }
    });
  }

  enhanceStaticMobileNavigation();

  function hasLiveCartItems() {
    try {
      const cart = JSON.parse(window.localStorage.getItem("karachi_bites_cart") || "null");
      return Boolean(cart && Array.isArray(cart.items) && cart.items.length > 0);
    } catch (_) {
      return false;
    }
  }

  // Individual Stitch exports are illustrative previews; send real order actions to the API-backed app.
  if (window.location.pathname.startsWith("/stitch/") &&
      window.location.pathname !== "/stitch/" &&
      window.location.pathname !== "/stitch/index.html") {
    const banner = document.createElement("div");
    banner.id = "kb-preview-banner";
    banner.setAttribute("role", "note");
    banner.style.cssText = "position:fixed;top:80px;left:0;right:0;z-index:45;background:#3A211E;color:#F7F3EC;padding:10px 16px;text-align:center;font:13px/1.4 Geist,system-ui,sans-serif;border-bottom:1px solid #B42318";
    const label = document.createElement("span");
    label.textContent = "DESIGN PREVIEW — sample cart/order data is not live. ";
    label.style.fontWeight = "600";
    const link = document.createElement("a");
    link.href = "/app.html#menu";
    link.textContent = "Start a real order";
    link.style.cssText = "color:#ffb4a8;text-decoration:underline;font-weight:600;margin-left:4px";
    banner.append(label, link);
    document.body.prepend(banner);
    document.body.style.paddingTop = "38px";
  }

  document.addEventListener("click", (event) => {
    const pathControl = event.target.closest("[data-path]");
    if (pathControl) {
      const destination = destinations[pathControl.getAttribute("data-path")];
      if (destination) {
        event.preventDefault();
        window.location.assign(destination);
        return;
      }
    }

    const control = event.target.closest("a,button");
    if (!control) return;
    const text = (control.innerText || control.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();

    if (control.closest("header") && text.includes("cart")) {
      event.preventDefault();
      window.location.assign("/app.html#cart");
      return;
    }

    if (control.classList.contains("add-to-cart-btn") || /add to cart/.test(text) || text === "search") {
      event.preventDefault();
      window.location.assign("/app.html#menu");
    } else if (/proceed to checkout/.test(text)) {
      event.preventDefault();
      window.location.assign(hasLiveCartItems() ? "/app.html#checkout" : "/app.html#menu");
    } else if (/view cart/.test(text)) {
      event.preventDefault();
      window.location.assign("/app.html#cart");
    } else if (/continue browsing menu|explore menu|browse heritage menu|order midnight delivery|back to menu/.test(text)) {
      event.preventDefault();
      window.location.assign("/app.html#menu");
    } else if (/back to cart/.test(text)) {
      event.preventDefault();
      window.location.assign("/app.html#cart");
    } else if (/back to confirmation/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/order-placed.html?preview=1");
    } else if (/track order live/.test(text)) {
      event.preventDefault();
      window.location.assign("/app.html#tracking");
    } else if (control.id === "toggle-state-btn" && typeof window.toggleCartState === "function") {
      window.toggleCartState();
    } else if (/content_copy|copy order/i.test(text)) {
      const id = document.getElementById("orderIdText");
      if (id && navigator.clipboard) navigator.clipboard.writeText(id.textContent.trim()).catch(() => {});
    }
  }, true);
})();
