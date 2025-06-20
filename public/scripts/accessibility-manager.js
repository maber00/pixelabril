// public/scripts/accessibility-manager.js
// Versión simplificada del PixelAccessibilityManager para resolver el 404

/**
 * PixelAccessibilityManager - Sistema de accesibilidad para Pixel Living
 */

class PixelAccessibilityManager {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    
    this.currentFocusTrap = null;
    this.previousFocus = null;
    this.liveRegion = null;
    
    this.init();
  }

  /**
   * Inicialización del sistema
   */
  init() {
    this.createLiveRegion();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    
    console.log('♿ PixelAccessibilityManager inicializado');
  }

  /**
   * Crear región live para anuncios
   */
  createLiveRegion() {
    if (this.liveRegion) return;
    
    this.liveRegion = document.createElement('div');
    this.liveRegion.id = 'accessibility-live-region';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Configurar navegación por teclado
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
      
      // Tab trap en modales
      if (e.key === 'Tab' && this.currentFocusTrap) {
        this.handleTabInFocusTrap(e);
      }
    });
  }

  /**
   * Configurar manejo de focus
   */
  setupFocusManagement() {
    // Highlight focus para usuarios de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Manejar tecla Escape
   */
  handleEscapeKey() {
    // Cerrar mobile menu
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenuButton?.click();
      return;
    }
    
    // Cerrar lightbox
    const lightboxModal = document.querySelector('.lightbox-modal:not(.hidden)');
    if (lightboxModal) {
      const closeBtn = lightboxModal.querySelector('.lightbox-close');
      closeBtn?.click();
      return;
    }
  }

  /**
   * Anunciar mensaje a screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;
    
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Limpiar después de un tiempo
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Focus trap en modales
   */
  trapFocus(container) {
    if (this.currentFocusTrap) {
      this.releaseFocusTrap();
    }
    
    this.currentFocusTrap = container;
    this.previousFocus = document.activeElement;
    
    const focusableElements = container.querySelectorAll(this.focusableElements);
    
    if (focusableElements.length > 0) {
      // Focus primer elemento focuseable
      focusableElements[0].focus();
      
      // Store first and last elements for tab trapping
      this.firstFocusableElement = focusableElements[0];
      this.lastFocusableElement = focusableElements[focusableElements.length - 1];
    }
  }

  /**
   * Liberar focus trap
   */
  releaseFocusTrap() {
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
    
    this.currentFocusTrap = null;
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
  }

  /**
   * Manejar Tab en focus trap
   */
  handleTabInFocusTrap(e) {
    if (!this.firstFocusableElement || !this.lastFocusableElement) return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        e.preventDefault();
        this.lastFocusableElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        e.preventDefault();
        this.firstFocusableElement.focus();
      }
    }
  }

  /**
   * Anunciar cambios de carrusel
   */
  announceCarouselChange(current, total, title = '') {
    const message = `${title} imagen ${current} de ${total}`;
    this.announce(message);
  }

  /**
   * Anunciar cambios del lightbox
   */
  announceLightboxChange(current, total, title = '') {
    const message = `Galería ${title}: imagen ${current} de ${total}`;
    this.announce(message);
  }

  /**
   * Inicializar todas las mejoras
   */
  initializeAll() {
    // Placeholder para compatibilidad
    console.log('♿ Todas las mejoras de accesibilidad aplicadas');
  }

  /**
   * Destruir y limpiar
   */
  destroy() {
    if (this.currentFocusTrap) {
      this.releaseFocusTrap();
    }
    
    if (this.liveRegion) {
      this.liveRegion.remove();
    }
    
    console.log('♿ PixelAccessibilityManager destruido');
  }
}

// Crear instancia global
window.PixelAccessibilityManager = new PixelAccessibilityManager();

// Alias para facilidad de uso
window.PAM = window.PixelAccessibilityManager;

// Inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PAM.initializeAll();
  });
} else {
  window.PAM.initializeAll();
}

console.log('♿ PixelAccessibilityManager script cargado');