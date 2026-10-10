// Category Pill Active Toggle
    document.querySelectorAll('.menu-tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.menu-tab-btn').forEach(b => {
          b.classList.remove('bg-[#2A2622]', 'text-[#B42318]', 'border', 'border-[#3A342E]', 'shadow-sm');
          b.classList.add('text-[#B8B0A6]');
          const dot = b.querySelector('span.rounded-full');
          if (dot) dot.remove();
        });
        this.classList.add('bg-[#2A2622]', 'text-[#B42318]', 'border', 'border-[#3A342E]', 'shadow-sm');
        this.classList.remove('text-[#B8B0A6]');
        
        const dot = document.createElement('span');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-[#B42318] inline-block mr-1.5';
        this.prepend(dot);
      });
    });

    // Add To Cart Toast Notification Micro-interaction
    function addToCart(dishName, price) {
      // Find or create toast container
      let toast = document.getElementById('kb-cart-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'kb-cart-toast';
        toast.className = 'fixed bottom-6 right-6 z-50 transform transition-all duration-300 translate-y-12 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
      }

      toast.innerHTML = `
        <div class="flex items-center gap-space-sm bg-[#2A2622] text-[#F7F3EC] border border-[#3A342E] px-4 py-3 rounded-xl shadow-2xl">
          <span class="material-symbols-outlined text-[#B42318] text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          <div class="flex flex-col">
            <span class="font-title-md text-body-sm font-semibold">${dishName}</span>
            <span class="font-body-sm text-[11px] text-[#B8B0A6]">Added to cart &bull; Rs. ${price}</span>
          </div>
        </div>
      `;

      // Animate In
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-12', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      // Animate Out after 2.8s
      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-12', 'opacity-0');
      }, 2800);
    }
