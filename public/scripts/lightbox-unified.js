// =============================================================================
// LIGHTBOX UNIFICADO PARA PIXEL LIVING - SOLUCIÓN DEFINITIVA
// Archivo: public/scripts/lightbox-unified.js
// =============================================================================

class PixelLightbox {
  constructor(modalId, lightboxData = {}) {
    this.modalId = modalId;
    this.lightboxData = lightboxData;
    this.currentEstudioId = '';
    this.currentImageIndex = 0;
    this.currentImages = [];
    this.thumbCarouselIndex = 0;
    
    // Configuración responsiva para thumbnails
    this.thumbnailsConfig = {
      mobile: 4,
      tablet: 6, 
      desktop: 8
    };
    
    this.initializeElements();
    this.bindEvents();
    this.setupGlobalHandlers();
    
  }
  
  // ===== INICIALIZACIÓN DE ELEMENTOS =====
  initializeElements() {
    this.modal = document.getElementById(this.modalId);
    if (!this.modal) {
      return;
    }
    
    // Elementos principales
    this.image = this.modal.querySelector('.lightbox-image');
    this.title = this.modal.querySelector('.lightbox-title');
    this.closeBtn = this.modal.querySelector('.lightbox-close');
    this.prevBtn = this.modal.querySelector('.lightbox-prev');
    this.nextBtn = this.modal.querySelector('.lightbox-next');
    this.currentSpan = this.modal.querySelector('.lightbox-current');
    this.totalSpan = this.modal.querySelector('.lightbox-total');
    
    this.thumbnailsContainer = this.modal.querySelector('.lightbox-thumbnails-carousel');
    this.thumbPrevBtn = this.modal.querySelector('.lightbox-thumb-prev');
    this.thumbNextBtn = this.modal.querySelector('.lightbox-thumb-next');
    
    this.detailsLink = this.modal.querySelector('.lightbox-details-link');
    this.reservaLink = this.modal.querySelector('.lightbox-reserva-link');
    
  
  }
  
  bindEvents() {
    if (!this.modal) return;
    
    this.closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
    });
    
    this.prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateImage(-1);
    });
    
    this.nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateImage(1);
    });
    
    this.thumbPrevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateThumbnailCarousel(-1);
    });
    
    this.thumbNextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateThumbnailCarousel(1);
    });
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    window.addEventListener('resize', () => this.handleResize());
    
    this.setupReservaButton();
  }
  
  setupReservaButton() {
    if (this.reservaLink) {
      const newReservaLink = this.reservaLink.cloneNode(true);
      this.reservaLink.parentNode?.replaceChild(newReservaLink, this.reservaLink);
      this.reservaLink = newReservaLink;
      
      this.reservaLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        
        
        // Cerrar lightbox
        this.close();
        
        // Disparar evento de estudio seleccionado
        this.dispatchEstudioSeleccionado();
        
        // Scroll suave a la sección de reservas
        setTimeout(() => this.scrollToReservas(), 300);
      });
      
    }
  }
  
  open(estudioId, imageIndex = 0) {
    
    const estudioData = this.lightboxData[estudioId];
    if (!estudioData) {
      return;
    }
    
    this.currentEstudioId = estudioId;
    this.currentImages = this.buildImageArray(estudioData);
    this.currentImageIndex = Math.max(0, Math.min(imageIndex, this.currentImages.length - 1));
    this.thumbCarouselIndex = 0;
    
    this.updateContent(estudioData);
    this.buildThumbnails();
    this.updateImage();
    this.show();
    
  }
  
  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  }
  
  updateContent(estudioData) {
    if (this.title) {
      this.title.textContent = estudioData.nombre || 'Apartaestudio';
    }
    
    if (this.detailsLink) {
      this.detailsLink.href = `/estudio/${this.currentEstudioId}`;
    }
    
    this.setupReservaButton();
  }
  
  buildImageArray(estudioData) {
    const images = [];
    
    if (estudioData.imagenPrincipal) {
      images.push(estudioData.imagenPrincipal);
    }
    
    if (estudioData.imagenes && Array.isArray(estudioData.imagenes)) {
      images.push(...estudioData.imagenes);
    }
    
    return images;
  }
  
  navigateImage(direction) {
    if (this.currentImages.length === 0) return;
    
    this.currentImageIndex += direction;
    
    if (this.currentImageIndex >= this.currentImages.length) {
      this.currentImageIndex = 0;
    } else if (this.currentImageIndex < 0) {
      this.currentImageIndex = this.currentImages.length - 1;
    }
    
    this.updateImage();
    this.updateThumbnailsVisibility();
  }
  
  updateImage() {
    if (!this.image || !this.currentImages[this.currentImageIndex]) return;
    
    const currentImg = this.currentImages[this.currentImageIndex];
    this.image.src = currentImg;
    this.image.alt = `Imagen ${this.currentImageIndex + 1} del apartaestudio`;
    
    if (this.currentSpan) this.currentSpan.textContent = this.currentImageIndex + 1;
    if (this.totalSpan) this.totalSpan.textContent = this.currentImages.length;
    
    this.updateActiveThumbnail();
  }
  
  buildThumbnails() {
    if (!this.thumbnailsContainer) return;
    
    this.thumbnailsContainer.innerHTML = '';
    
    this.currentImages.forEach((imgSrc, index) => {
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'flex-shrink-0 cursor-pointer transition-all duration-200 lightbox-thumb';
      thumbDiv.innerHTML = `
        <img 
          src="${imgSrc}" 
          alt="Miniatura ${index + 1}" 
          class="w-12 h-12 md:w-16 md:h-16 object-cover rounded-md border-2 ${
            index === this.currentImageIndex 
              ? 'border-white opacity-100' 
              : 'border-gray-500 opacity-70 hover:opacity-90'
          }"
        />
      `;
      
      thumbDiv.addEventListener('click', () => {
        this.currentImageIndex = index;
        this.updateImage();
        this.updateThumbnailsVisibility();
      });
      
      this.thumbnailsContainer.appendChild(thumbDiv);
    });
  }
  
  updateActiveThumbnail() {
    const thumbs = this.thumbnailsContainer?.querySelectorAll('.lightbox-thumb img');
    if (!thumbs) return;
    
    thumbs.forEach((thumb, index) => {
      if (index === this.currentImageIndex) {
        thumb.className = thumb.className.replace('border-gray-500 opacity-70', 'border-white opacity-100');
      } else {
        thumb.className = thumb.className.replace('border-white opacity-100', 'border-gray-500 opacity-70');
      }
    });
  }
  
  // ===== NAVEGACIÓN DEL CARRUSEL DE THUMBNAILS =====
  navigateThumbnailCarousel(direction) {
    const thumbnailsPerView = this.getThumbnailsPerView();
    const maxIndex = Math.max(0, this.currentImages.length - thumbnailsPerView);
    
    this.thumbCarouselIndex += direction;
    
    if (this.thumbCarouselIndex > maxIndex) this.thumbCarouselIndex = maxIndex;
    if (this.thumbCarouselIndex < 0) this.thumbCarouselIndex = 0;
    
    this.updateThumbnailsVisibility();
  }
  
  // ===== VISIBILIDAD DE THUMBNAILS =====
  updateThumbnailsVisibility() {
    if (!this.thumbnailsContainer) return;
    
    const thumbnailsPerView = this.getThumbnailsPerView();
    const thumbWidth = 64 + 8; // 16*4 (w-16) + gap
    const translateX = -this.thumbCarouselIndex * thumbWidth;
    
    this.thumbnailsContainer.style.transform = `translateX(${translateX}px)`;
  }
  
  // ===== CONFIGURACIÓN RESPONSIVA =====
  getThumbnailsPerView() {
    const width = window.innerWidth;
    if (width < 768) return this.thumbnailsConfig.mobile;
    if (width < 1024) return this.thumbnailsConfig.tablet;
    return this.thumbnailsConfig.desktop;
  }
  
  // ===== MOSTRAR MODAL =====
  show() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    }
  }
  
  // ===== MANEJO DE TECLADO =====
  handleKeyboard(e) {
    if (!this.modal || this.modal.classList.contains('hidden')) return;
    
    switch(e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.navigateImage(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.navigateImage(1);
        break;
    }
  }
  
  // ===== MANEJO RESPONSIVE =====
  handleResize() {
    this.updateThumbnailsVisibility();
  }
  
  // ===== EVENTO DE ESTUDIO SELECCIONADO =====
  dispatchEstudioSeleccionado() {
    const estudioData = this.lightboxData[this.currentEstudioId];
    const event = new CustomEvent('estudioSeleccionado', {
      detail: {
        estudioId: this.currentEstudioId,
        estudioNombre: estudioData?.nombre || 'Estudio seleccionado'
      },
      bubbles: true,
      cancelable: true
    });
    
    document.dispatchEvent(event);
  }
  
  scrollToReservas() {
    const reservasSection = document.querySelector('#reservas');
    if (reservasSection) {
      reservasSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      const form = document.querySelector('form[data-estudio-form]');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  
  setupGlobalHandlers() {
    window.openPixelLightbox = (estudioId, imageIndex = 0) => {
      this.open(estudioId, imageIndex);
    };
    
    document.addEventListener('click', (e) => {
      if (e.target.closest('.open-gallery-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.open-gallery-btn');
        const estudioId = btn.getAttribute('data-estudio-id');
        if (estudioId) {
          this.open(estudioId, 0);
        }
      }
      
      if (e.target.closest('.gallery-thumb')) {
        e.preventDefault();
        const thumb = e.target.closest('.gallery-thumb');
        const estudioId = thumb.getAttribute('data-estudio-id');
        const imgIndex = parseInt(thumb.getAttribute('data-img-index') || '0');
        if (estudioId) {
          this.open(estudioId, imgIndex);
        }
      }
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  
  // Verificar que lightboxData esté disponible
  const lightboxData = window.lightboxData || {};
  
  if (Object.keys(lightboxData).length === 0) {
  }
  
  // Inicializar lightbox
  window.pixelLightboxInstance = new PixelLightbox('espacios-lightbox', lightboxData);
  
});


window.openLightbox = function(estudioId, imageIndex = 0) {
  if (window.pixelLightboxInstance) {
    window.pixelLightboxInstance.open(estudioId, imageIndex);
  } else {
  }
};

// Export para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PixelLightbox;
}