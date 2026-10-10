(function initMenuInteractions() {
      // 1. Search Query and Empty State
      const searchInput = document.getElementById('menuSearchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      const foodCards = document.querySelectorAll('.food-item-card');
      const emptyState = document.getElementById('emptySearchState');
      const resetBtn = document.getElementById('resetSearchAction');

      function filterMenu() {
        const query = searchInput.value.toLowerCase().trim();
        let matchCount = 0;

        if (query.length > 0) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }

        foodCards.forEach(card => {
          const title = card.getAttribute('data-name').toLowerCase();
          if (title.includes(query)) {
            card.classList.remove('hidden');
            matchCount++;
          } else {
            card.classList.add('hidden');
          }
        });

        if (matchCount === 0) {
          emptyState.classList.remove('hidden');
          emptyState.classList.add('flex');
        } else {
          emptyState.classList.add('hidden');
          emptyState.classList.remove('flex');
        }
      }

      if (searchInput) {
        searchInput.addEventListener('input', filterMenu);
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          filterMenu();
          searchInput.focus();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          searchInput.value = '';
          filterMenu();
        });
      }

      // 2. Interactive Stepper in Nihari Card
      document.querySelectorAll('.step-inc').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const valEl = this.parentElement.querySelector('.stepper-val');
          if (valEl) {
            let count = parseInt(valEl.textContent, 10) || 1;
            valEl.textContent = count + 1;
          }
        });
      });

      document.querySelectorAll('.step-dec').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const valEl = this.parentElement.querySelector('.stepper-val');
          if (valEl) {
            let count = parseInt(valEl.textContent, 10) || 1;
            if (count > 1) {
              valEl.textContent = count - 1;
            }
          }
        });
      });

      // 3. Category Pills Active Highlighting
      const categoryPills = document.querySelectorAll('.category-pill');
      categoryPills.forEach(pill => {
        pill.addEventListener('click', function() {
          categoryPills.forEach(p => {
            p.classList.remove('bg-[#B42318]', 'text-[#F7F3EC]', 'font-semibold', 'shadow-xs');
            p.classList.add('bg-[#2A2622]', 'border', 'border-[#3A342E]', 'text-[#B8B0A6]');
          });
          this.classList.remove('bg-[#2A2622]', 'border', 'border-[#3A342E]', 'text-[#B8B0A6]');
          this.classList.add('bg-[#B42318]', 'text-[#F7F3EC]', 'font-semibold', 'shadow-xs');
        });
      });

      // 4. Cart Quick Drawer Toggle
      const viewCartBtn = document.getElementById('viewCartDrawerBtn');
      const cartModal = document.getElementById('cartModalOverlay');
      const closeCartBtn = document.getElementById('closeCartModalBtn');

      if (viewCartBtn && cartModal) {
        viewCartBtn.addEventListener('click', () => {
          cartModal.classList.remove('hidden');
        });
      }

      if (closeCartBtn && cartModal) {
        closeCartBtn.addEventListener('click', () => {
          cartModal.classList.add('hidden');
        });
      }

      if (cartModal) {
        cartModal.addEventListener('click', (e) => {
          if (e.target === cartModal) {
            cartModal.classList.add('hidden');
          }
        });
      }

      // 5. Add to Cart feedback animation
      document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const originalHTML = this.innerHTML;
          const wasDarkSecondary = this.classList.contains('bg-[#211E1B]');
          this.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Added';
          this.classList.remove('bg-[#211E1B]', 'text-[#F7F3EC]');
          this.classList.add('bg-[#B42318]', 'text-[#F7F3EC]');
          setTimeout(() => {
            this.innerHTML = originalHTML;
            if (wasDarkSecondary) {
              this.classList.remove('bg-[#B42318]');
              this.classList.add('bg-[#211E1B]');
            }
          }, 1400);
        });
      });
    })();
