let subtotal = 3470;
    let discount = 347;
    let itemCount = 3;

    function recalculateTotal() {
      const gst = Math.round(subtotal * 0.05);
      const delivery = subtotal > 0 ? 150 : 0;
      const packaging = subtotal > 0 ? 50 : 0;
      const appliedDiscount = subtotal > 0 ? discount : 0;
      const grandTotal = Math.max(0, subtotal - appliedDiscount + gst + delivery + packaging);

      const subtotalEl = document.getElementById('ledger-subtotal');
      const gstEl = document.getElementById('ledger-gst');
      const totalEl = document.getElementById('ledger-total');
      const countPill = document.getElementById('cart-count-pill');

      if (subtotalEl) subtotalEl.textContent = 'Rs. ' + subtotal.toLocaleString();
      if (gstEl) gstEl.textContent = 'Rs. ' + gst.toLocaleString();
      if (totalEl) totalEl.textContent = 'Rs. ' + grandTotal.toLocaleString();
      if (countPill) countPill.textContent = itemCount + ' items';
    }

    function updateQty(id, delta, unitPrice) {
      const qtyElem = document.getElementById(id);
      if (!qtyElem) return;
      let current = parseInt(qtyElem.textContent, 10);
      let updated = current + delta;
      if (updated < 1) return;
      
      qtyElem.textContent = updated;
      subtotal += (delta * unitPrice);
      recalculateTotal();
    }

    function removeItem(articleId, itemTotalCost) {
      const el = document.getElementById(articleId);
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        setTimeout(() => {
          el.remove();
          subtotal = Math.max(0, subtotal - itemTotalCost);
          itemCount = Math.max(0, itemCount - 1);
          if (itemCount === 0) {
            toggleCartState();
          } else {
            recalculateTotal();
          }
        }, 200);
      }
    }

    function toggleCartState() {
      const activeView = document.getElementById('active-cart-view');
      const emptyView = document.getElementById('empty-cart-view');
      const label = document.getElementById('toggle-state-label');
      
      if (activeView.classList.contains('hidden')) {
        activeView.classList.remove('hidden');
        emptyView.classList.add('hidden');
        emptyView.classList.remove('flex');
        label.textContent = 'Preview Empty State';
      } else {
        activeView.classList.add('hidden');
        emptyView.classList.remove('hidden');
        emptyView.classList.add('flex');
        label.textContent = 'Show Filled Cart';
      }
    }

    document.getElementById('toggle-state-btn').addEventListener('click', toggleCartState);
