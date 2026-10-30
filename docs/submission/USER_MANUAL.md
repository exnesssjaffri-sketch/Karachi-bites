# Karachi Bites — User Manual

This manual is intended for customers, staff, and administrators who use the Karachi Bites system.

---

# 1. Customer Guide

## 1.1 Accessing the Website

Open https://karachi-bites.vercel.app/ in any modern web browser (Chrome, Edge, Firefox, Safari).

## 1.2 Browsing the Menu

The homepage displays menu categories as tabs: BBQ, Karahi, Rice, Rolls, Drinks, Desserts. Click a tab to filter the menu. You can also:

- Use the search box to find items by name.
- Toggle "Vegetarian Only" or "Spicy Only" filters.
- Set a maximum price slider.

Each dish card shows the item name, price in Pakistani Rupees (PKR), and an "Add to Cart" button.

## 1.3 Adding Items to Cart

Click "Add to Cart" on any dish. A quantity badge appears on the cart icon in the navigation bar. Click the badge or the "Cart" link to view your cart. In the cart you can:

- Change the quantity of each item (+ / \u2212 buttons).
- Remove an item entirely.
- See the subtotal, delivery fee (Rs. 150), and grand total.

The cart is saved in your browser\'s local storage and will persist if you close and reopen the page.

## 1.4 Checkout

From the cart, click "Proceed to Checkout". Fill in the required fields:

- **Name** \u2014 your full name (at least 2 characters).
- **Phone** \u2014 your Pakistani mobile number (format: 03XXXXXXXXX, 11 digits starting with 03).
- **Address** \u2014 your full delivery address (at least 5 characters).
- **Branch** \u2014 select the restaurant branch nearest to you (Clifton, Gulshan-e-Iqbal, or North Nazimabad).
- **Special Instructions** (optional) \u2014 any notes for the kitchen (e.g., "extra spicy").

Click "Place Order". The server validates all fields and calculates the total. If successful, you are redirected to the order confirmation page showing your unique Order ID (format: KB-YYYYMMDD-XXXXXXXX), order total, list of items, and selected branch.

**Important:** Save your Order ID. You will need it to track your order.

## 1.5 Tracking Your Order

Go to the "Track Order" page (linked in the navigation bar). Enter:

1. Your Order ID (as shown on the confirmation page).
2. The phone number you provided at checkout.

Click "Track Order". If the phone number matches the order, the full order details including current status are displayed. If the phone does not match, you will see an error. This protects customer privacy.

After tracking, you may see an "Order Again" button. Clicking it re-submits the same items to the same branch using the phone number you just entered.

## 1.6 Language Toggle

Click the language toggle button in the navigation bar (shows "\u6230\u8a9e" when in English, "English" when in Urdu). The entire interface switches to Urdu and the layout becomes right-to-left (RTL). Your language preference is saved in the browser and restored on your next visit.
---

# 2. Staff Guide

## 2.1 Logging In

Navigate to https://karachi-bites.vercel.app/admin. Enter your staff username and password. Click "Sign In". On success, you are redirected to the dashboard. Your session is stored in the browser tab only and is cleared when you close the tab.

## 2.2 Viewing Orders

The dashboard displays a table of recent orders with columns:

- **Order ID** \u2014 click to open the kitchen ticket.
- **Customer** \u2014 customer name.
- **Phone** \u2014 customer phone number.
- **Total** \u2014 order total in PKR.
- **Status** \u2014 current status (Received, Preparing, Out for Delivery, Delivered).
- **Branch** \u2014 which branch the order was placed at.
- **Date** \u2014 when the order was placed.

Use the **Branch** dropdown and **Date** picker to filter the table.

## 2.3 Updating Order Status

For each order, there is a "Status" dropdown. Select the next valid status and click "Update". The server validates the transition:

- Received \u2192 Preparing
- Preparing \u2192 Out for Delivery
- Out for Delivery \u2192 Delivered

Invalid transitions are rejected with an error message.

## 2.4 Printing a Kitchen Ticket

Click the "Kitchen Ticket" link next to any order. A print-friendly page opens in the same tab showing the order items, quantities, kitchen notes, and total. Use your browser\'s print dialog (Ctrl+P / Cmd+P) to print the ticket. The staff session token is preserved because the ticket opens in the same tab.

---

# 3. Administrator Guide

In addition to all staff capabilities, administrators can:

## 3.1 Managing the Menu

Navigate to the "Menu" tab in the admin dashboard (admin only). You can:

- **Add a new item** \u2014 fill in name, price, category, tags, and availability.
- **Edit an existing item** \u2014 click "Edit" to change any field.
- **Hide an item** \u2014 click "Hide" (soft-delete). The item remains in the database but is removed from the public menu. Historical orders referencing the item remain intact.
- **Unhide an item** \u2014 set availability back to true to make the item visible again.

## 3.2 Exporting Orders to CSV

Click the "Export" button in the admin dashboard. Optionally set a date range (from / to). The server generates a CSV file with columns: Order ID, Customer, Phone, Total, Status, Date. The export includes formula-injection protection so that hostile values in customer names or addresses cannot execute formulas in spreadsheet software.

Only administrators can export; staff accounts receive a 403 Forbidden error.

## 3.3 Security Notes

- Never share your admin credentials.
- Change the default admin and staff passwords before deploying to production.
- Use a strong, random `JWT_SECRET` in your production environment variables.
- Do not commit `.env` or any file containing secrets to the repository.

---

# 4. General Notes

- **Payment:** The system assumes cash on delivery. No online payment is integrated.
- **Delivery fee:** A fixed Rs. 150 delivery fee is added to every order, calculated server-side.
- **Data retention:** Order data is stored in the database indefinitely. There is no automatic deletion.
- **Browser compatibility:** The application is tested on Chrome and Edge. It should work on Firefox and Safari but has not been exhaustively tested on those browsers.
