/**
 * Main router for the API-backed ordering flow.
 * The Stitch-designed homepage is served from /; this SPA handles menu,
 * cart, checkout, order confirmation, and tracking.
 */
class Router {
  constructor() {
    this.routes = {
      "#home": () => this.loadPage("home"),
      "#menu": () => this.loadPage("menu"),
      "#cart": () => this.loadPage("cart"),
      "#checkout": () => this.loadPage("checkout"),
      "#order-placed": () => this.loadPage("order-placed"),
      "#tracking": () => this.loadPage("tracking"),
    };
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash || "#home";
    const routeName = hash.split("?")[0];
    const route = this.routes[routeName];

    if (route) {
      route();
    } else {
      this.loadPage("home");
    }
  }

  loadPage(page) {
    const container = document.getElementById("app");
    if (!container) return;

    if (page === "home") {
      window.location.replace("/");
      return;
    }

    container.setAttribute("aria-busy", "true");
    container.innerHTML = "";
    document.body.dataset.page = page;

    if (window.renderNavbar) window.renderNavbar("site-nav");

    switch (page) {
      case "menu":
        menuPage.init();
        break;
      case "cart":
        cartPage.init();
        break;
      case "checkout":
        checkoutPage.init();
        break;
      case "order-placed":
        orderPlacedPage.init();
        break;
      case "tracking":
        orderTrackingPage.init();
        break;
      default:
        window.location.replace("/");
        return;
    }

    if (window.renderFooter) window.renderFooter("site-footer");
    container.setAttribute("aria-busy", "false");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Router();
});
