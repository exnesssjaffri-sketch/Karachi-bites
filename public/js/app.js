/**
 * Main Router
 * Handles client-side routing based on URL hash
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
    // Listen for hash changes
    window.addEventListener("hashchange", () => this.handleRoute());

    // Handle initial load
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash || "#home";
    const routeName = hash.split("?")[0];
    const route = this.routes[routeName];

    if (route) {
      route();
    } else {
      // Default to home page
      this.loadPage("home");
    }
  }

  loadPage(page) {
    const container = document.getElementById("app");
    if (!container) return;

    // Clear container
    container.innerHTML = "";

    // Render navbar
    if (window.renderNavbar) {
      window.renderNavbar("app");
    }

    // Render page content
    switch (page) {
      case "home":
        homePage.init();
        break;
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
        homePage.init();
    }

    // Render footer
    if (window.renderFooter) {
      window.renderFooter("app");
    }
  }
}

// Initialize router when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new Router();
});
