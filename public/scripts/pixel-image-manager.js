/**
 * PIXEL IMAGE MANAGER - SOLO PARA IMÁGENES
 * Sistema de gestión de imágenes para Pixel Living
 */

class PixelImageManager {
  constructor() {
    this.lazyImages = new Map();
    this.observers = new Map();
    this.config = {
      rootMargin: '50px',
      threshold: 0.1,
      quality: {
        mobile: 80,
        desktop: 90
      }
    };
    this.init();
  }

  init() {
    console.log('🖼️ Inicializando PixelImageManager...');
    this.setupLazyLoading();
    this.setupImageOptimization();
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            lazyImageObserver.unobserve(img);
          }
        });
      }, this.config);

      document.querySelectorAll('img[data-src]').forEach(img => {
        lazyImageObserver.observe(img);
      });
    }
  }

  loadImage(img) {
    img.src = img.dataset.src;
    img.classList.remove('lazy');
    img.classList.add('loaded');
  }

  setupImageOptimization() {
    // Optimización de imágenes
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', () => {
        img.src = '/images/placeholder.webp';
      });
    });
  }
}

// ===== INICIALIZACIÓN GLOBAL =====
window.PixelImageManager = PixelImageManager;

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PIM = new PixelImageManager();
  });
} else {
  window.PIM = new PixelImageManager();
}

console.log('✅ PixelImageManager (LIMPIO) cargado');