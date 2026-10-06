/**
 * Home Page Component
 * Renders the home page
 */
const homePage = {
  featuredDishes: [
    { id: 101, name: 'Special Sindhi Chicken Biryani', price: 890, image: 'https://lh3.googleusercontent.com/AB6AXuBxrDqlxmKfBENQyHcp6fnC1spiPhEJvcv2wygOrE-vQoKHq3yfl7kBza5752Qajvy-gWtk5lCN9yGV2yZ' },
    { id: 102, name: 'Shahi Mutton Nihari', price: 1450, image: 'https://lh3.googleusercontent.com/AEtjO1X5JDLkTYIiu_U9iJVvQ5AMpwwLk3MACsnUMP7WlpFwaygYoAa6mzLPhpe2Uwdy3j' },
    { id: 103, name: 'Burns Road Seekh Kebabs', price: 920, image: 'https://lh3.googleusercontent.com/aida-public/AEtjO1W_iaXo9iJEYJIWdCXkqphIQrIKsG3PTqV2tK7vPOfB6Zr' },
    { id: 104, name: 'Desi Ghee Karahi', price: 1650, image: 'https://lh3.googleusercontent.com/AEtjO1X5JDLkTYIiu_U9iJVvQ5AMpwwLk3MACsnUMP7WlpFwaygYoAa6mzLPhpe2Uwdy3j' },
    { id: 105, name: 'Zinger Roll', price: 450, image: 'https://lh3.googleusercontent.com/AEtjO1W_iaXo9iJEYJIWdCXkqphIQrIKsG3PTqV2tK7vPOfB6Zr' },
    { id: 106, name: 'Gulab Jamun', price: 250, image: 'https://lh3.googleusercontent.com/AEtjO1W_iaXo9iJEYJIWdCXkqphIQrIKsG3PTqV2tK7vPOfB6Zr' },
  ],

  async init() {
    try {
      const result = await api.getMenu();
      if (result.success) {
        this.featuredDishes = result.data.slice(0, 6);
      } else {
        console.error('Failed to load menu:', result.error);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    }
    this.render();
    this.bindEvents();
  },

  render() {
    return `
      <section class="bg-[#181614] pt-24 pb-16 px-6">
        <div class="max-w-7xl mx-auto text-center space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#211E1B] border border-[#3A342E]">
            <span class="w-2 h-2 rounded-full bg-[#B42318]"></span>
            <span class="text-[#F7F3EC] text-sm">Authentic Burns Road Flavors</span>
          </div>
          <h1 class="font-headline text-[#F7F3EC] text-4xl font-semibold">
            Charcoal, Clay & Slow Spice.<br/>
            <span class="text-[#B42318]">The Pure Spirit</span> of Karachi Food.
          </h1>
          <p class="text-[#B8B0A6] max-w-xl mx-auto">
            Rooted in Karachi's legendary Burns Road, bringing 70+ years of culinary heritage to your table.
          </p>
          <div class="flex justify-center gap-4 pt-4">
            <a href="#menu" class="inline-flex items-center gap-2 bg-[#B42318] hover:bg-[#9E1C13] text-white px-6 py-3 rounded-lg font-title transition-all" data-link>Menu</a>
            <a href="#cart" class="inline-flex items-center gap-2 bg-[#2A2622] hover:bg-[#3A342E] border border-[#3A342E] text-white px-6 py-3 rounded-lg font-title transition-all" data-link>Cart</a>
          </div>
        </div>
      </section>

      <section class="py-16 px-6">
        <div class="max-w-7xl mx-auto">
          <h2 class="font-headline text-[#F7F3EC] text-2xl font-semibold mb-8">Featured dishes</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.featuredDishes.map(dISH => `
              <article class="bg-[#2A2622] border border-[#3A342E] rounded-xl overflow-hidden hover:border-[#B42318]/50 transition-all flex flex-col">
                <div class="relative aspect-[4/3] overflow-hidden bg-[#181614]">
                  <img src="${dISH.image}" alt="${dISH.name}" class="w-full h-full object-cover"/>
                  <div class="absolute top-3 left-3">
                    <span class="px-2 py-0.5 rounded bg-[#B42318] text-white text-xs font-semibold">Bestseller</span>
                  </div>
                </div>
                <div class="p-5 flex flex-col flex-1">
                  <h3 class="font-title text-[#F7F3EC] text-lg font-semibold mb-1">${dISH.name}</h3>
                  <div class="mt-auto flex items-center justify-between gap-3">
                    <span class="font-price text-[#B42318]">${cartStore.formatPrice(dISH.price)}</span>
                    <button class="add-to-cart-btn bg-[#B42318] hover:bg-[#9E1C13] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1" data-id="${dISH.id}" data-price="${dISH.price}" data-name="${dISH.name}" data-link>
                      <span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add
                    </button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  bindEvents() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        cartStore.addItem({ id: id, price: parseInt(btn.dataset.price), name: btn.dataset.name, quantity: 1 });
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Added';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
          btn.innerHTML = '<span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add';
          btn.classList.remove('bg-green-600');
          btn.classList.add('bg-[#B42318]');
        }, 1500);
      });
    });
  },
};

window.addEventListener('DOMContentLoaded', () => {
  homePage.init();
});