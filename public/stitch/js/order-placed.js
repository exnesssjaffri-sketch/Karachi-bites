function showCopiedFeedback(btn) {
      const toast = document.getElementById('copiedToast');
      if (toast) {
        toast.classList.remove('opacity-0');
        toast.classList.add('opacity-100');
        setTimeout(() => {
          toast.classList.remove('opacity-100');
          toast.classList.add('opacity-0');
        }, 2000);
      }
    }
