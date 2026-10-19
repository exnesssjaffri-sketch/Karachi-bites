/**
 * Karachi Bites API Client
 * Handles all communication with the backend server
 */
const API_BASE_URL = '/api';

// API methods
const api = {
  /**
   * Get menu items from the backend
   */
  async getMenu() {
    try {
      const response = await fetch(`${API_BASE_URL}/menu`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new order
   * @param {Object} orderData - Order data with customer, branch, items
   */
  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to create order:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get order details by order ID
   * @param {string} orderId - The order ID (e.g., KB-YYYYMMDD-XXXXX)
   */
  async getOrder(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.status === 404) {
        return { success: false, error: 'Order not found' };
      }
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Admin login for backend access
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async adminLogin(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid credentials');
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Admin login failed:', error);
      return { success: false, error: error.message };
    }
  },
};

// Export for use in other modules
window.api = api;