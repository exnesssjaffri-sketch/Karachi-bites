(() => {
  const destinations = {
    home: "/",
    menu: "/stitch/menu.html",
    "order-now": "/stitch/menu.html",
    cart: "/stitch/cart.html",
    "track-order": "/stitch/order-tracking.html?preview=1",
    "order-confirmation": "/stitch/order-placed.html?preview=1"
  };

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

    // The Stitch exports have a header cart button that originally had no navigation.
    if (control.closest("header") && /shopping_bag\s*cart\b/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/cart.html");
      return;
    }

    if (/proceed to checkout/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/ordersummary.html?preview=1");
    } else if (/view cart/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/cart.html");
    } else if (/continue browsing menu|explore menu|browse heritage menu|order midnight delivery|back to cart/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/menu.html");
    } else if (/back to confirmation/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/order-placed.html?preview=1");
    } else if (/track order live/.test(text)) {
      event.preventDefault();
      window.location.assign("/stitch/order-tracking.html?preview=1");
    } else if (control.id === "toggle-state-btn" && typeof window.toggleCartState === "function") {
      window.toggleCartState();
    } else if (/content_copy|copy order/i.test(text)) {
      const id = document.getElementById("orderIdText");
      if (id && navigator.clipboard) navigator.clipboard.writeText(id.textContent.trim()).catch(() => {});
    }
  }, true);
})();
