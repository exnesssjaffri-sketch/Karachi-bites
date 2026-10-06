/**
 * Footer Component
 * Renders the footer with branding and links
 */
const footer = {
  categories: [
    'Biryani & Pulao',
    'Nihari & Haleem',
    'Karahi & Curries',
    'Charcoal BBQ & Kebabs',
    'Paratha Rolls',
    'Desserts & Beverages',
  ],

  render() {
    return `
      <footer class="bg-[#181614] border-t border-[#3A342E]">
        <div class="max-w-7xl mx-auto px-6 py-12">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            <!-- Brand Section -->
            <div class="lg:col-span-2 space-y-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-[#B42318] flex items-center justify-center">
                  <span class="material-symbols-outlined text-white text-sm">restaurant</span>
                </div>
                <span class="font-headline text-[#F7F3EC] font-semibold text-lg">Karachi Bites</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded bg-[#2A2622] border border-[#3A342E] text-[#B8B0A6] text-xs uppercase tracking-wider">Est. 1952</span>
              </div>
              <p class="text-[#B8B0A6] max-w-sm text-sm">Rooted in Burns Road, Karachi's legendary food district. Slow-cooked, charcoal-grilled, passionately spiced culinary heritage brought straight to your dining ledger.</p>
              <div class="flex items-center gap-2 pt-2">
                <span class="w-2 h-2 rounded-full bg-[#B42318] animate-pulse"></span>
                <span class="text-[#B8B0A6] text-sm font-medium">Kitchen Status:</span>
                <span class="text-[#F7F3EC] text-sm font-semibold">Open & Delivering across City Limits</span>
              </div>
            </div>

            <!-- Categories -->
            <div>
              <h3 class="font-title text-[#F7F3EC] font-semibold mb-4">Menu Categories</h3>
              <ul class="space-y-2 text-[#B8B0A6] text-sm">
                ${this.categories.map(cat => `
                  <li>
                    <a href="#menu?category=${encodeURIComponent(cat)}" class="hover:text-[#B42318] transition-colors block" data-link>${cat}</a>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Contact -->
            <div>
              <h3 class="font-title text-[#F7F3EC] font-semibold mb-4">Contact</h3>
              <ul class="space-y-2 text-[#B8B0A6] text-sm">
                <li class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm mt-0.5">phone</span>
                  <span>+92 300 1234567</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm mt-0.5">location_on</span>
                  <span>Burns Road, Karachi</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm mt-0.5">schedule</span>
                  <span>Open: 11 AM - 11 PM</span>
                </li>
              </ul>
            </div>

          </div>

          <!-- Bottom Bar -->
          <div class="mt-8 pt-6 border-t border-[#3A342E] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-xs text-[#5c534b]">© 2026 Karachi Bites. All rights reserved.</p>
            <div class="flex items-center gap-6 text-xs text-[#B8B0A6]">
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span>
                Halal Certified
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-[#B42318]"></span>
                Fast Delivery
              </span>
            </div>
          </div>
        </div>
      </footer>
    `;
  },
};

// Render footer to container
window.renderFooter = (containerId) => {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = footer.render();
  }
};