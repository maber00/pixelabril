// LIGHTBOX RESPONSIVO CON CARRUSEL DE THUMBNAILS
// Este script se debe integrar tanto en Espacios.astro como en las páginas individuales de estudio

document.addEventListener('DOMContentLoaded', () => {
  
  const getThumbnailsPerView = () => {
    const width = window.innerWidth;
    if (width < 641) return 5;        
    if (width < 1025) return 6;       
    return 8;                         
  };
  
  class ResponsiveLightbox {
    constructor(modalId, lightboxData) {
      this.modalId = modalId;
      this.lightboxData = lightboxData || {};
      this.currentEstudioId = '';
      this.currentImageIndex = 0;
      this.currentImages = [];
      this.thumbCarouselIndex = 0;
      this.thumbnailsPerView = getThumbnailsPerView();
      
      this.initializeElements();
      this.bindEvents();
    }
    
    initializeElements() {
      this.modal = document.getElementById(this.modalId);
      if (!this.modal) {
        return;
      }
      
      this.image = this.modal.querySelector('.lightbox-image');
      this.title = this.modal.querySelector('.lightbox-title');
      this.closeBtn = this.modal.querySelector('.lightbox-close');
      this.prevBtn = this.modal.querySelector('.lightbox-prev');
      this.nextBtn = this.modal.querySelector('.lightbox-next');
      this.detailsLink = this.modal.querySelector('.lightbox-details-link');
      this.reservaLink = this.modal.querySelector('.lightbox-reserva-link');
      this.currentSpan = this.modal.querySelector('.lightbox-current');
      this.totalSpan = this.modal.querySelector('.lightbox-total');
      
      // Elementos del carrusel de thumbnails
      this.thumbCarousel = this.modal.querySelector('.lightbox-thumbnails-carousel');
      this.thumbPrevBtn = this.modal.querySelector('.thumb-carousel-prev');
      this.thumbNextBtn = this.modal.querySelector('.thumb-carousel-next');
      
      
    }
    
    bindEvents() {
      if (!this.modal) return;
      
      // Cerrar modal
      this.closeBtn?.addEventListener('click', () => this.close());
      
      // Navegación principal
      this.prevBtn?.addEventListener('click', () => this.navigateImage(-1));
      this.nextBtn?.addEventListener('click', () => this.navigateImage(1));
      
      // Navegación del carrusel de thumbnails
      this.thumbPrevBtn?.addEventListener('click', () => this.navigateThumbnailCarousel(-1));
      this.thumbNextBtn?.addEventListener('click', () => this.navigateThumbnailCarousel(1));
      
      // Click fuera del modal
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
      
      // Teclado
      document.addEventListener('keydown', (e) => this.handleKeyboard(e));
      
      // Responsive
      window.addEventListener('resize', () => this.handleResize());
      
      // Botón reserva
      this.reservaLink?.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
        this.dispatchEstudioSeleccionado();
        setTimeout(() => this.scrollToReservas(), 200);
      });
    }
    
    // ===== FUNCIONES PRINCIPALES =====
    
    open(estudioId, imageIndex = 0) {
      
      const estudioData = this.lightboxData[estudioId];
      if (!estudioData) {
        return;
      }
      
      this.currentEstudioId = estudioId;
      this.currentImages = this.buildImageArray(estudioData);
      this.currentImageIndex = Math.max(0, Math.min(imageIndex, this.currentImages.length - 1));
      this.thumbCarouselIndex = 0;
      
      if (this.title) this.title.textContent = estudioData.nombre;
      
      // Actualizar enlaces
      const currentPath = window.location.pathname;
const isEnglish = currentPath.startsWith('/en');

if (this.detailsLink) {
  this.detailsLink.href = isEnglish ? `/en/estudio/${estudioId}` : `/estudio/${estudioId}`;
}

if (this.reservaLink) {
  this.reservaLink.href = isEnglish ? '/en/#reservas' : '/#reservas';
}
      // Construir thumbnails
      this.buildThumbnails();
      
      // Actualizar imagen y mostrar modal
      this.updateImage();
      this.show();
      
    }
    
    close() {
      this.modal?.classList.add('hidden');
      this.modal?.classList.remove('flex');
      document.body.style.overflow = '';
    }
    
    show() {
      this.modal?.classList.remove('hidden');
      this.modal?.classList.add('flex');
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => this.closeBtn?.focus(), 100);
    }
    
    navigateImage(direction) {
      if (this.currentImages.length === 0) return;
      
      this.currentImageIndex = (this.currentImageIndex + direction + this.currentImages.length) % this.currentImages.length;
      this.updateImage();
      this.ensureThumbnailVisible();
    }
    
    navigateThumbnailCarousel(direction) {
      const maxIndex = Math.max(0, this.currentImages.length - this.thumbnailsPerView);
      
      if (direction === -1) {
        this.thumbCarouselIndex = Math.max(0, this.thumbCarouselIndex - 1);
      } else {
        this.thumbCarouselIndex = Math.min(maxIndex, this.thumbCarouselIndex + 1);
      }
      
      this.updateThumbnailCarousel();
    }
    
    // ===== FUNCIONES DE CONSTRUCCIÓN =====
    
    buildImageArray(estudioData) {
      const images = [];
      
      // Imagen principal
      if (estudioData.imagenPrincipal) {
        images.push({
          src: estudioData.imagenPrincipal,
          alt: `${estudioData.nombre} - Imagen principal`
        });
      }
      
      // Galería adicional
      if (estudioData.imagenes && Array.isArray(estudioData.imagenes)) {
        estudioData.imagenes.forEach((src, index) => {
          images.push({
            src: src,
            alt: `${estudioData.nombre} - Imagen ${index + 1}`
          });
        });
      }
      
      return images;
    }
    
    buildThumbnails() {
      if (!this.thumbCarousel) return;
      
      this.thumbCarousel.innerHTML = '';
      
      this.currentImages.forEach((image, index) => {
        const thumb = document.createElement('button');
        thumb.className = `lightbox-thumbnail mr-2 last:mr-0 rounded-md overflow-hidden border-2 border-transparent hover:border-white focus:border-yellow-400 transition-all duration-200`;
        thumb.setAttribute('aria-label', `Ver ${image.alt}`);
        thumb.setAttribute('data-index', index.toString());
        
        thumb.innerHTML = `
          <img 
            src="${image.src}" 
            alt="" 
            class="w-full h-full object-cover"
            loading="lazy"
          />
        `;
        
        thumb.addEventListener('click', () => {
          this.currentImageIndex = index;
          this.updateImage();
        });
        
        this.thumbCarousel.appendChild(thumb);
      });
      
      // Actualizar responsive
      this.updateThumbnailSizes();
      this.updateThumbnailCarousel();
    }
    
    updateThumbnailSizes() {
      if (!this.thumbCarousel) return;
      
      const thumbnails = this.thumbCarousel.querySelectorAll('.lightbox-thumbnail');
      const gap = 0.5; // rem
      const totalGaps = (this.thumbnailsPerView - 1) * gap;
      const thumbnailWidth = `calc((100% - ${totalGaps}rem) / ${this.thumbnailsPerView})`;
      
      thumbnails.forEach(thumb => {
        thumb.style.width = thumbnailWidth;
        thumb.style.aspectRatio = '1';
        thumb.style.flexShrink = '0';
      });
    }
    
    // ===== FUNCIONES DE ACTUALIZACIÓN =====
    
    updateImage() {
      if (!this.image || this.currentImages.length === 0) return;
      
      const currentImage = this.currentImages[this.currentImageIndex];
      
      // Transición suave
      this.image.style.opacity = '0.7';
      
      setTimeout(() => {
        this.image.src = currentImage.src;
        this.image.alt = currentImage.alt;
        this.image.style.opacity = '1';
      }, 150);
      
      // Actualizar contador
      if (this.currentSpan) this.currentSpan.textContent = (this.currentImageIndex + 1).toString();
      if (this.totalSpan) this.totalSpan.textContent = this.currentImages.length.toString();
      
      // Actualizar botones de navegación
      this.updateNavigationButtons();
      
      // Actualizar thumbnails activas
      this.updateActiveThumbnail();
    }
    
    updateNavigationButtons() {
      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentImageIndex === 0;
        this.prevBtn.style.opacity = this.currentImageIndex === 0 ? '0.5' : '1';
      }
      
      if (this.nextBtn) {
        this.nextBtn.disabled = this.currentImageIndex === this.currentImages.length - 1;
        this.nextBtn.style.opacity = this.currentImageIndex === this.currentImages.length - 1 ? '0.5' : '1';
      }
    }
    
    updateActiveThumbnail() {
      if (!this.thumbCarousel) return;
      
      const thumbnails = this.thumbCarousel.querySelectorAll('.lightbox-thumbnail');
      thumbnails.forEach((thumb, index) => {
        const isActive = index === this.currentImageIndex;
        thumb.style.opacity = isActive ? '1' : '0.7';
        thumb.style.borderColor = isActive ? '#ffffff' : 'transparent';
      });
    }
    
    updateThumbnailCarousel() {
      if (!this.thumbCarousel) return;
      
      const translateX = -(this.thumbCarouselIndex * (100 / this.thumbnailsPerView));
      this.thumbCarousel.style.transform = `translateX(${translateX}%)`;
      
      // Actualizar botones del carrusel
      this.updateThumbnailCarouselButtons();
    }
    
    updateThumbnailCarouselButtons() {
      const maxIndex = Math.max(0, this.currentImages.length - this.thumbnailsPerView);
      
      if (this.thumbPrevBtn) {
        this.thumbPrevBtn.style.opacity = this.thumbCarouselIndex === 0 ? '0.5' : '1';
        this.thumbPrevBtn.disabled = this.thumbCarouselIndex === 0;
      }
      
      if (this.thumbNextBtn) {
        this.thumbNextBtn.style.opacity = this.thumbCarouselIndex >= maxIndex ? '0.5' : '1';
        this.thumbNextBtn.disabled = this.thumbCarouselIndex >= maxIndex;
      }
    }
    
    ensureThumbnailVisible() {
      const currentThumbIndex = this.currentImageIndex;
      const visibleStart = this.thumbCarouselIndex;
      const visibleEnd = this.thumbCarouselIndex + this.thumbnailsPerView - 1;
      
      if (currentThumbIndex < visibleStart) {
        this.thumbCarouselIndex = currentThumbIndex;
        this.updateThumbnailCarousel();
      } else if (currentThumbIndex > visibleEnd) {
        this.thumbCarouselIndex = Math.max(0, currentThumbIndex - this.thumbnailsPerView + 1);
        this.updateThumbnailCarousel();
      }
    }
    
    // ===== EVENTOS =====
    
    handleKeyboard(e) {
      if (this.modal?.classList.contains('hidden')) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.navigateImage(-1);
          break;
        case 'ArrowRight':
          this.navigateImage(1);
          break;
      }
    }
    
    handleResize() {
      const newThumbnailsPerView = getThumbnailsPerView();
      if (newThumbnailsPerView !== this.thumbnailsPerView) {
        this.thumbnailsPerView = newThumbnailsPerView;
        this.updateThumbnailSizes();
        this.thumbCarouselIndex = 0; // Reset position
        this.updateThumbnailCarousel();
      }
    }
    
    // ===== INTEGRACIÓN CON RESERVAS =====
    
    dispatchEstudioSeleccionado() {
      const estudioData = this.lightboxData[this.currentEstudioId];
      const event = new CustomEvent('estudioSeleccionado', {
        detail: { 
          estudioId: this.currentEstudioId,
          estudioNombre: estudioData ? estudioData.nombre : 'Estudio seleccionado'
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
      }
    }
  }
  
  
  const lightboxModals = document.querySelectorAll('.lightbox-modal');
  const lightboxInstances = [];
  
  lightboxModals.forEach(modal => {
    const modalId = modal.id;
    
    let lightboxData = {};
    if (typeof window.lightboxData !== 'undefined') {
      lightboxData = window.lightboxData;
    } else if (typeof lightboxData !== 'undefined') {
      lightboxData = window.lightboxData;
    }
    
    const instance = new ResponsiveLightbox(modalId, lightboxData);
    lightboxInstances.push(instance);
    
  });
  
  // Función global para abrir lightbox (compatible con código existente)
  window.openLightbox = function(estudioId, imageIndex = 0) {
    if (lightboxInstances.length > 0) {
      lightboxInstances[0].open(estudioId, imageIndex);
    }
  };
  
  // ===== EVENTOS PARA ABRIR LIGHTBOX =====
  
  // Botones de galería
  document.querySelectorAll('.open-gallery-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const estudioId = btn.getAttribute('data-estudio-id');
      if (estudioId && window.openLightbox) {
        window.openLightbox(estudioId, 0);
      }
    });
  });
  
  // Thumbnails de galería
  document.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const estudioId = thumb.getAttribute('data-estudio-id');
      const imgIndex = parseInt(thumb.getAttribute('data-img-index') || '0');
      if (estudioId && window.openLightbox) {
        const lightboxIndex = imgIndex === -1 ? 0 : imgIndex + 1;
        window.openLightbox(estudioId, lightboxIndex);
      }
    });
  });
  
  // Imágenes principales
  document.querySelectorAll('.main-image').forEach(img => {
    img.addEventListener('click', (e) => {
      if (e.target !== img) return;
      const estudioId = img.getAttribute('data-estudio-id');
      if (estudioId && window.openLightbox) {
        window.openLightbox(estudioId, 0);
      }
    });
    
    // Soporte de teclado
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        img.click();
      }
    });
  });
  
  
  
  // Debug
  window.lightboxDebug = {
    instances: lightboxInstances,
    openLightbox: window.openLightbox,
    getThumbnailsPerView
  };
});