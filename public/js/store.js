/**
 * Cart Store
 * Manages cart state with localStorage persistence
 */
const cartStore = {
  STORAGE_KEY: 'karachi_bites_cart',

  /**
   * Get cart from localStorage or initialize empty cart
   */
  getCart() {
    if (typeof localStorage === 'undefined') {
      return { items: [], total: 0, itemCount: 0 };
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : { items: [], total: 0, itemCount: 0 };
    } catch (error) {
      console.error('Error reading cart from storage:', error);
      return { items: [], total: 0, itemCount: 0 };
    }
  },

  /**
   * Save cart to localStorage
   */
  setCart(cart) {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      cart.total = this.calculateTotal();
      cart.itemCount = this.calculateItemCount(cart.items);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  },

  /**
   * Calculate total from cart items
   */
  calculateTotal(cart = null) {
    const items = cart?.items || this.getCart().items;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  /**
   * Calculate total count from cart items
   */
  calculateItemCount(cart = null) {
    const items = cart?.items || this.getCart().items;
    return items.reduce((count, item) => count + item.quantity, 0);
  },

  /**
   * Add item to cart (or increase quantity if exists)
   */
  addItem(item) {
    const cart = this.getCart();
    
    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      cart.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      });
    }
    
    this.setCart(cart);
    this._notifyCartUpdate();
    return cart;
  },

  /**
   * Update item quantity
   */
  updateQuantity(itemId, delta) {
    const cart = this.getCart();
    const itemIndex = cart.items.findIndex(i => i.id === itemId);
    
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity += delta;
      
      // Remove item if quantity is 0 or less
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    }
    
    this.setCart(cart);
    this._notifyCartUpdate();
    return cart;
  },

  /**
   * Remove item from cart
   */
  removeItem(itemId) {
    const cart = this.getCart();
    cart.items = cart.items.filter(i => i.id !== itemId);
    this.setCart(cart);
    this._notifyCartUpdate();
    return cart;
  },

  /**
   * Clear the entire cart
   */
  clearCart() {
    const cart = { items: [], total: 0, itemCount: 0 };
    this.setCart(cart);
    this._notifyCartUpdate();
    return cart;
  },

  /**
   * Dispatch cartUpdated event for live badge updates
   */
  _notifyCartUpdate() {
    window.dispatchEvent(new Event('cartUpdated'));
  },

  /**
   * Get items by category
   */
  getItemsByCategory(category) {
    const menu = window.menuItems || [];
    if (!category) return menu;
    return menu.filter(item => item.category === category);
  },

  /**
   * Format price helper
   */
  formatPrice(price) {
    return `Rs. ${price.toLocaleString('en-PK')}`;
  },

  /**
   * Export cart info for API call
   */
  exportForOrder() {
    const cart = this.getCart();
    if (cart.items.length === 0) {
      return null;
    }
    
    return {
      customer: {
        name: document.getElementById('customer-name')?.value || '',
        phone: document.getElementById('customer-phone')?.value || '',
        address: document.getElementById('customer-address')?.value || '',
      },
      branch: 'Clifton',
      items: cart.items,
    };
  },
};

// Export for use in other modules
window.cartStore = cartStore;

// Initialize cart on page load
window.addEventListener('DOMContentLoaded', () => {
  cartStore.setCart(cartStore.getCart());
});