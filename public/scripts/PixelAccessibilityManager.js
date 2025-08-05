/**
 * PixelAccessibilityManager - Sistema de accesibilidad para Pixel Living
 * 
 * Características:
 * - Focus trap en modales
 * - ARIA labels dinámicos
 * - Skip links
 * - Keyboard navigation
 * - Screen reader support
 * - High contrast mode
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
    this.skipLinks = [];
    
    this.init();
  }

  /**
   * Inicialización del sistema
   */
  init() {
    this.createSkipLinks();
    this.enhanceMenus();
    this.enhanceButtons();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.announcePageChanges();
    
  }

  
  createSkipLinks() {
    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
      <a href="#navigation" class="skip-link">Saltar a navegación</a>
      <a href="#espacios" class="skip-link">Saltar a espacios</a>
      <a href="#reservas" class="skip-link">Saltar a reservas</a>
    `;
    
    // Insertar al inicio del body
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
    
    // Estilos para skip links
    const skipStyles = document.createElement('style');
    skipStyles.textContent = `
      .skip-links {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        font-weight: bold;
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      }
      
      .skip-link:focus {
        transform: translateY(0);
        outline: 2px solid #ffd700;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(skipStyles);
  }

  /**
   * Mejorar menús con ARIA
   */
  enhanceMenus() {
    // Header navigation
    const nav = document.querySelector('nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Navegación principal');
    }

    // Mobile menu button
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.setAttribute('aria-expanded', 'false');
      mobileMenuButton.setAttribute('aria-controls', 'mobileMenu');
      mobileMenuButton.setAttribute('aria-label', 'Abrir menú de navegación');
      
      mobileMenu.setAttribute('aria-hidden', 'true');
      
      // Interceptar toggle del menú
      mobileMenuButton.addEventListener('click', () => {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        mobileMenuButton.setAttribute('aria-expanded', newState);
        mobileMenu.setAttribute('aria-hidden', !newState);
        mobileMenuButton.setAttribute('aria-label', 
          newState ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
        );
        
        if (newState) {
          this.trapFocus(mobileMenu);
        } else {
          this.releaseFocusTrap();
        }
      });
    }
  }

  /**
   * Mejorar botones con roles apropiados
   */
  enhanceButtons() {
    // Elementos que actúan como botones pero no son <button>
    const buttonLikeElements = document.querySelectorAll(`
      [data-carousel-prev],
      [data-carousel-next],
      [data-carousel-indicator],
      .gallery-thumb,
      .open-gallery-btn,
      .lightbox-close,
      .lightbox-prev,
      .lightbox-next
    `);
    
    buttonLikeElements.forEach(element => {
      if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        
        // Agregar keyboard support
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
          }
        });
      }
    });

    // Carrusel buttons específicos
    this.enhanceCarouselButtons();
    
    // Lightbox buttons específicos
    this.enhanceLightboxButtons();
  }

  /**
   * Mejorar botones del carrusel
   */
  enhanceCarouselButtons() {
    const prevBtns = document.querySelectorAll('[data-carousel-prev], #prev-btn, #coliving-prev');
    const nextBtns = document.querySelectorAll('[data-carousel-next], #next-btn, #coliving-next');
    const indicators = document.querySelectorAll('[data-carousel-indicator]');
    
    prevBtns.forEach(btn => {
      btn.setAttribute('aria-label', 'Imagen anterior');
      btn.setAttribute('title', 'Imagen anterior');
    });
    
    nextBtns.forEach(btn => {
      btn.setAttribute('aria-label', 'Imagen siguiente');
      btn.setAttribute('title', 'Imagen siguiente');
    });
    
    indicators.forEach((indicator, index) => {
      indicator.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
      indicator.setAttribute('title', `Imagen ${index + 1}`);
    });
  }

  /**
   * Mejorar botones del lightbox
   */
  enhanceLightboxButtons() {
    // Observar cuando se abra el lightbox para configurar ARIA
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('lightbox-modal') && !target.classList.contains('hidden')) {
            this.setupLightboxAccessibility(target);
          }
        }
      });
    });

    const lightboxModal = document.querySelector('.lightbox-modal');
    if (lightboxModal) {
      observer.observe(lightboxModal, { attributes: true });
    }
  }

  /**
   * Configurar accesibilidad del lightbox
   */
  setupLightboxAccessibility(modal) {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lightbox-title');
    
    const title = modal.querySelector('.lightbox-title');
    if (title) {
      title.id = 'lightbox-title';
    }
    
    const closeBtn = modal.querySelector('.lightbox-close');
    if (closeBtn) {
      closeBtn.setAttribute('aria-label', 'Cerrar galería');
    }
    
    const prevBtn = modal.querySelector('.lightbox-prev');
    if (prevBtn) {
      prevBtn.setAttribute('aria-label', 'Imagen anterior en galería');
    }
    
    const nextBtn = modal.querySelector('.lightbox-next');
    if (nextBtn) {
      nextBtn.setAttribute('aria-label', 'Imagen siguiente en galería');
    }
    
    // Focus trap en modal
    this.trapFocus(modal);
    
    // Announce modal opening
    this.announce('Galería de imágenes abierta. Use las flechas para navegar o Escape para cerrar.');
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
    
    // Estilos para keyboard navigation
    const focusStyles = document.createElement('style');
    focusStyles.textContent = `
      /* Solo mostrar outline cuando se navega con teclado */
      *:focus {
        outline: none;
      }
      
      .keyboard-navigation *:focus {
        outline: 2px solid #ffd700;
        outline-offset: 2px;
      }
      
      /* Focus específico para elementos pixel */
      .keyboard-navigation .btn:focus {
        box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.5);
      }
      
      .keyboard-navigation .gallery-thumb:focus {
        transform: scale(1.05);
        box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.8);
      }
      
      /* Focus visible para carousel */
      .keyboard-navigation [data-carousel-indicator]:focus {
        transform: scale(1.2);
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px #ffd700;
      }
    `;
    document.head.appendChild(focusStyles);
  }

  /**
   * Anunciar cambios de página/estado
   */
  announcePageChanges() {
    // Crear live region para announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    
    this.liveRegion = liveRegion;
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
   * Marcar contenido principal
   */
  markMainContent() {
    const main = document.querySelector('main');
    if (main) {
      main.id = 'main-content';
      main.setAttribute('role', 'main');
    }
  }

  /**
   * Mejorar formularios con labels apropiados
   */
  enhanceForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Asegurar que todos los inputs tengan labels
      const inputs = form.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('aria-label')) {
          // Crear label implícito basado en placeholder o name
          const labelText = input.placeholder || input.name || 'Campo de entrada';
          input.setAttribute('aria-label', labelText);
        }
        
        // Required fields
        if (input.hasAttribute('required')) {
          const currentLabel = input.getAttribute('aria-label') || '';
          input.setAttribute('aria-label', `${currentLabel} (requerido)`);
        }
      });
      
      // Error messages
      const errorElements = form.querySelectorAll('.error-message, .field-error');
      errorElements.forEach(error => {
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'assertive');
      });
    });
  }

  /**
   * Configurar landmarks ARIA
   */
  setupLandmarks() {
    // Header
    const header = document.querySelector('header');
    if (header) {
      header.setAttribute('role', 'banner');
    }
    
    // Main navigation
    const nav = document.querySelector('nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Navegación principal');
    }
    
    // Main content
    this.markMainContent();
    
    // Footer
    const footer = document.querySelector('footer');
    if (footer) {
      footer.setAttribute('role', 'contentinfo');
    }
    
    // Sections as regions
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const heading = section.querySelector('h1, h2, h3');
      if (heading) {
        section.setAttribute('role', 'region');
        section.setAttribute('aria-labelledby', heading.id || section.id + '-heading');
        if (!heading.id) {
          heading.id = section.id + '-heading';
        }
      }
    });
  }

  /**
   * Configurar soporte para lectores de pantalla
   */
  setupScreenReaderSupport() {
    // Ocultar elementos decorativos
    const decorativeElements = document.querySelectorAll(`
      .pixel-pattern,
      .pixel-divider::before,
      .pixel-title-decoration::before
    `);
    
    decorativeElements.forEach(el => {
      el.setAttribute('aria-hidden', 'true');
    });
    
    // Describir carrusel
    const carousels = document.querySelectorAll('[data-carousel], .carousel');
    carousels.forEach(carousel => {
      carousel.setAttribute('role', 'region');
      carousel.setAttribute('aria-label', 'Carrusel de imágenes');
      carousel.setAttribute('aria-live', 'polite');
    });
    
    // Describir galerías
    const galleries = document.querySelectorAll('.gallery, .lightbox-thumbnails');
    galleries.forEach(gallery => {
      gallery.setAttribute('role', 'group');
      gallery.setAttribute('aria-label', 'Galería de imágenes');
    });
  }

  /**
   * Inicializar todas las mejoras
   */
  initializeAll() {
    this.markMainContent();
    this.enhanceForms();
    this.setupLandmarks();
    this.setupScreenReaderSupport();
    
  }

  /**
   * Método público para anunciar eventos del carrusel
   */
  announceCarouselChange(current, total, title = '') {
    const message = `${title} imagen ${current} de ${total}`;
    this.announce(message);
  }

  /**
   * Método público para anunciar cambios del lightbox
   */
  announceLightboxChange(current, total, title = '') {
    const message = `Galería ${title}: imagen ${current} de ${total}`;
    this.announce(message);
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

