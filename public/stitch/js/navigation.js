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
