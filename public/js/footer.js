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
      <footer class="w-full bg-[#181614] border-t border-[#3A342E] mt-space-xl">
        <div class="w-full max-w-7xl mx-auto px-6 py-space-xl">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg">
            <!-- Brand Section -->
            <div class="lg:col-span-2 flex flex-col gap-space-md">
              <div class="flex items-center gap-space-sm">
                <span class="font-headline-md text-headline-md text-[#F7F3EC] font-semibold">Karachi Bites</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded bg-[#211E1B] border border-[#3A342E] text-[#B8B0A6] font-label-sm text-label-sm uppercase tracking-wide">Est. 1952</span>
              </div>
              <p class="font-body-md text-body-md text-[#B8B0A6] max-w-md">Rooted in Burns Road, Karachi's legendary food district. Slow-cooked, charcoal-grilled, passionately spiced culinary heritage brought straight to your dining ledger.</p>
              <div class="flex items-center gap-space-xs pt-space-xs">
                <span class="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#B42318]"></span>
                <span class="font-label-sm text-label-sm text-[#B8B0A6] font-medium">Kitchen Status:</span>
                <span class="font-label-sm text-label-sm text-[#F7F3EC] font-semibold">Open & Delivering across City Limits</span>
              </div>
            </div>

            <!-- Categories -->
            <div class="flex flex-col gap-space-sm">
              <h3 class="font-title-md text-title-md text-[#F7F3EC]">Menu Categories</h3>
              <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-[#B8B0A6]">
                ${this.categories.map(cat => `
                  <li>
                    <a href="#menu?category=${encodeURIComponent(cat)}" class="hover:text-[#B42318] transition-colors cursor-pointer" data-link>${cat}</a>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Contact -->
            <div class="flex flex-col gap-space-sm">
              <h3 class="font-title-md text-title-md text-[#F7F3EC]">Contact</h3>
              <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-[#B8B0A6]">
                <li class="flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-sm mt-0.5">phone</span>
                  <span>+92 21 3262 5000</span>
                </li>
                <li class="flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-sm mt-0.5">location_on</span>
                  <span>Burns Road, Karachi</span>
                </li>
                <li class="flex items-start gap-space-xs">
                  <span class="material-symbols-outlined text-sm mt-0.5">schedule</span>
                  <span>Open: 11 AM - 1:30 AM</span>
                </li>
              </ul>
            </div>

            <!-- About / Legal -->
            <div class="flex flex-col gap-space-sm">
              <h3 class="font-title-md text-title-md text-[#F7F3EC]">About</h3>
              <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-[#B8B0A6]">
                <li><a href="#about" class="hover:text-[#B42318] transition-colors cursor-pointer" data-link>Our Story</a></li>
                <li><a href="#burns-rd" class="hover:text-[#B42318] transition-colors cursor-pointer" data-link>Burns Road Heritage</a></li>
                <li><a href="#careers" class="hover:text-[#B42318] transition-colors cursor-pointer" data-link>Careers</a></li>
              </ul>
            </div>
          </div>

          <!-- Bottom Bar -->
          <div class="mt-space-xl pt-space-lg border-t border-[#3A342E] flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <p class="font-body-sm text-body-sm text-[#B8B0A6]">© 2024 Karachi Bites Hospitality Group. Authentic Burns Road Heritage. All rights reserved.</p>
            <div class="flex items-center gap-space-md font-label-sm text-label-sm text-[#B8B0A6]">
              <a class="hover:text-[#F7F3EC] transition-colors" href="#">Privacy Policy</a>
              <a class="hover:text-[#F7F3EC] transition-colors" href="#">Terms of Order</a>
              <a class="hover:text-[#F7F3EC] transition-colors" href="#">Dispatch Ledger</a>
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