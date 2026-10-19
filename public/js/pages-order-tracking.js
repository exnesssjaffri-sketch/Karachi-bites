const orderTrackingPage = {
  orderData: null,
  orderId: null,
  loading: false,
  error: null,
  verifiedPhone: null,

  escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  async init() {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    this.orderId = params.get("order") || "";
    this.orderData = null;
    this.error = null;
    this.verifiedPhone = null;
    this.loading = false;
    this.render();
  },

  async track(orderId, phone) {
    this.orderId = String(orderId || "").trim();
    this.error = null;
    this.verifiedPhone = null;
    this.loading = true;
    this.render();

    try {
      if (!window.api || typeof window.api.trackOrder !== "function") {
        throw new Error("Order tracking is temporarily unavailable. Please try again.");
      }
      const result = await window.api.trackOrder(this.orderId, String(phone || "").trim());
      if (!result.success) {
        this.orderData = null;
        this.error = result.error || "We could not find an order matching those details.";
      } else {
        this.orderData = result.data;
        this.verifiedPhone = String(phone || '').trim();
      }
    } catch (error) {
      console.error("Failed to track order:", error);
      this.orderData = null;
      this.error = "We could not verify your order right now. Please try again.";
    } finally {
      this.loading = false;
      this.render();
    }
  },

  render() {
    const container = document.getElementById("app");
    if (!container) return;

    if (this.loading) {
      container.innerHTML = '<section class="px-4 pb-24 pt-28 sm:px-6"><div class="mx-auto max-w-2xl rounded-xl border border-[#3A342E] bg-[#211E1B] p-8 text-center" role="status"><span class="material-symbols-outlined animate-pulse text-5xl text-[#B42318]" aria-hidden="true">hourglass_bottom</span><p class="mt-4 text-[#B8B0A6]">Verifying your order details…</p></div></section>';
      return;
    }

    if (!this.orderData) {
      container.innerHTML =
        '<section class="px-4 pb-24 pt-28 sm:px-6"><div class="mx-auto max-w-xl">' +
          '<nav class="mb-6 flex items-center gap-2 text-sm text-[#B8B0A6]"><a href="/" class="hover:text-white" data-link>Home</a><span aria-hidden="true">›</span><span class="text-[#F7F3EC]">Track Order</span></nav>' +
          '<div class="rounded-2xl border border-[#3A342E] bg-[#211E1B] p-6 sm:p-8">' +
            '<span class="material-symbols-outlined mb-3 text-4xl text-[#B42318]" aria-hidden="true">local_shipping</span>' +
            '<h1 class="font-headline text-2xl font-semibold text-[#F7F3EC]">Track Your Order</h1>' +
            '<p class="mb-6 mt-2 text-sm leading-6 text-[#B8B0A6]">Enter the order ID from your confirmation and the Pakistani mobile number used at checkout. We verify both before showing order details.</p>' +
            (this.error ? '<p class="mb-4 rounded-lg border border-[#B42318]/50 bg-[#B42318]/10 p-3 text-sm text-[#ffd9d3]" role="alert">' + this.escapeHtml(this.error) + '</p>' : '') +
            '<form id="orderLookupForm" class="space-y-4">' +
              '<div><label for="orderLookupId" class="mb-2 block text-sm font-medium text-[#F7F3EC]">Order ID</label><input id="orderLookupId" name="orderId" type="text" required maxlength="80" autocomplete="off" value="' + this.escapeHtml(this.orderId) + '" placeholder="e.g. KB-20261010-ABC123" class="min-h-12 w-full rounded-lg border border-[#3A342E] bg-[#181614] px-4 py-3 text-[#F7F3EC] placeholder-[#B8B0A6]/60 focus:border-[#B42318] focus:outline-none" /></div>' +
              '<div><label for="orderLookupPhone" class="mb-2 block text-sm font-medium text-[#F7F3EC]">Checkout phone number</label><input id="orderLookupPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" placeholder="03XXXXXXXXX" class="min-h-12 w-full rounded-lg border border-[#3A342E] bg-[#181614] px-4 py-3 text-[#F7F3EC] placeholder-[#B8B0A6]/60 focus:border-[#B42318] focus:outline-none" /></div>' +
              '<button type="submit" class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#B42318] px-5 py-3 font-semibold text-white transition hover:bg-[#C93627]"><span class="material-symbols-outlined" aria-hidden="true">search</span>Verify & Track Order</button>' +
            '</form>' +
          '</div>' +
        '</div></section>';

      const form = container.querySelector("#orderLookupForm");
      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const orderId = container.querySelector("#orderLookupId")?.value || "";
        const phone = container.querySelector("#orderLookupPhone")?.value || "";
        if (!orderId.trim() || !phone.trim()) return;
        void this.track(orderId, phone);
      });
      return;
    }

    const order = this.orderData;
    const status = String(order.status || "received").toLowerCase().replace(/\s+/g, "-");
    const statusSteps = ["received", "preparing", "out-for-delivery", "delivered"];
    const currentStepIndex = statusSteps.indexOf(status);
    const safeStatus = currentStepIndex < 0 ? 0 : currentStepIndex;
    const items = Array.isArray(order.items) ? order.items : [];

    container.innerHTML =
      '<section class="px-4 pb-24 pt-28 sm:px-6"><div class="mx-auto max-w-3xl">' +
        '<div class="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p class="mb-1 text-xs font-semibold uppercase tracking-wider text-[#B8B0A6]">Order tracking</p><h1 class="font-headline text-2xl font-semibold text-[#F7F3EC]">Your Order Status</h1></div><span class="rounded-lg border border-[#3A342E] bg-[#211E1B] px-3 py-2 text-sm text-[#F7F3EC]">' + this.escapeHtml(order.orderId || this.orderId) + '</span></div>' +
        '<div class="mb-6 rounded-2xl border border-[#3A342E] bg-[#211E1B] p-6"><div class="mb-6 flex items-center gap-4"><div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#B42318]/15"><span class="material-symbols-outlined text-2xl text-[#B42318]" aria-hidden="true">motorcycle</span></div><div><h2 class="font-semibold text-[#F7F3EC]">' + this.escapeHtml(statusSteps[safeStatus].replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())) + '</h2><p class="mt-1 text-sm text-[#B8B0A6]">Latest status reported by the kitchen</p></div></div>' +
        '<ol class="space-y-4">' + statusSteps.map((step, index) => {
          const completed = index <= safeStatus;
          const current = index === safeStatus;
          return '<li class="flex items-start gap-3"><span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ' + (completed ? 'bg-[#B42318]' : 'bg-[#3A342E]') + '"><span class="material-symbols-outlined text-sm text-white" aria-hidden="true">' + (completed ? 'check' : 'radio_button_unchecked') + '</span></span><div><p class="' + (completed ? 'text-[#F7F3EC]' : 'text-[#B8B0A6]') + '">' + this.escapeHtml(step.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())) + '</p><p class="text-xs text-[#B8B0A6]">' + (current ? 'Current status' : completed ? 'Completed' : 'Pending') + '</p></div></li>';
        }).join("") + '</ol></div>' +
        '<div class="rounded-2xl border border-[#3A342E] bg-[#211E1B] p-6"><h2 class="mb-4 font-semibold text-[#F7F3EC]">Order Summary</h2>' +
          (items.length ? items.map((item) => '<div class="flex justify-between gap-4 border-b border-[#3A342E] py-3 text-sm"><span class="text-[#B8B0A6]">' + this.escapeHtml(item.name || "Item") + ' × ' + this.escapeHtml(item.quantity || 1) + '</span><span class="text-[#F7F3EC]">' + this.escapeHtml(window.cartStore.formatPrice(Number(item.price || 0) * Number(item.quantity || 1))) + '</span></div>').join("") : '<p class="py-3 text-sm text-[#B8B0A6]">Order items are not available.</p>') +
          '<div class="mt-4 flex justify-between gap-4"><span class="text-sm text-[#B8B0A6]">Total</span><span class="font-semibold text-[#F7F3EC]">' + this.escapeHtml(window.cartStore.formatPrice(Number(order.total || 0))) + '</span></div>' +
        '</div><div class="mt-5 rounded-2xl border border-[#3A342E] bg-[#211E1B] p-6"><button id="showReorderForm" type="button" class="min-h-11 rounded-lg bg-[#B42318] px-4 py-2 text-sm font-semibold text-white">Order Again</button>' +
          '<form id="reorderForm" class="hidden mt-4 space-y-4" novalidate><p class="text-sm text-[#B8B0A6]">We will repeat available items from this order. The original checkout phone must match.</p>' +
            '<div><label for="reorderName" class="mb-2 block text-sm font-medium text-[#F7F3EC]">Full name</label><input id="reorderName" required maxlength="100" autocomplete="name" class="min-h-11 w-full rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2 text-[#F7F3EC]" /></div>' +
            '<div><label for="reorderPhone" class="mb-2 block text-sm font-medium text-[#F7F3EC]">Verified checkout phone</label><input id="reorderPhone" readonly value="' + this.escapeHtml(this.verifiedPhone || "") + '" class="min-h-11 w-full rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2 text-[#F7F3EC]" /></div>' +
            '<div><label for="reorderAddress" class="mb-2 block text-sm font-medium text-[#F7F3EC]">Delivery address</label><textarea id="reorderAddress" required minlength="5" maxlength="500" autocomplete="street-address" rows="3" class="w-full rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2 text-[#F7F3EC]"></textarea></div>' +
            '<div><label for="reorderNotes" class="mb-2 block text-sm font-medium text-[#F7F3EC]">Order notes (optional)</label><textarea id="reorderNotes" maxlength="500" rows="2" class="w-full rounded-lg border border-[#3A342E] bg-[#181614] px-3 py-2 text-[#F7F3EC]"></textarea></div>' +
            '<p id="reorderFeedback" class="hidden text-sm" role="alert" aria-live="polite"></p><button id="submitReorder" type="submit" class="min-h-11 rounded-lg bg-[#B42318] px-4 py-2 text-sm font-semibold text-white">Place Same Order Again</button></form></div>' +
        '<button id="trackAnotherOrder" type="button" class="mt-5 min-h-11 rounded-lg border border-[#3A342E] px-4 py-2 text-sm font-semibold text-[#F7F3EC] hover:border-[#B42318]">Track another order</button>' +
      '</div></section>';

    container.querySelector("#showReorderForm")?.addEventListener("click", () => {
      container.querySelector("#reorderForm")?.classList.toggle("hidden");
    });
    container.querySelector("#reorderForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = container.querySelector("#reorderFeedback");
      const submit = container.querySelector("#submitReorder");
      const name = container.querySelector("#reorderName").value.trim();
      const address = container.querySelector("#reorderAddress").value.trim();
      const notes = container.querySelector("#reorderNotes").value.trim();
      if (name.length < 2 || address.length < 5 || !this.verifiedPhone) {
        feedback.textContent = "Enter your name and a valid delivery address.";
        feedback.classList.remove("hidden");
        return;
      }
      submit.disabled = true;
      submit.textContent = "Placing order…";
      feedback.classList.add("hidden");
      try {
        const result = await window.api.reorderOrder(this.orderId, { name, phone: this.verifiedPhone, address, notes });
        if (!result.success || !result.data || !result.data.orderId) throw new Error(result.error || "Could not place the repeat order.");
        window.location.hash = "#order-placed?order=" + encodeURIComponent(result.data.orderId);
      } catch (error) {
        feedback.textContent = error.message || "Could not place the repeat order. Please try again.";
        feedback.classList.remove("hidden");
      } finally {
        submit.disabled = false;
        submit.textContent = "Place Same Order Again";
      }
    });
    container.querySelector("#trackAnotherOrder")?.addEventListener("click", () => {
      this.orderData = null;
      this.verifiedPhone = null;
      this.error = null;
      this.orderId = "";
      this.render();
    });
  },
};
