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
    
    console.log('✅ PixelLightbox inicializado correctamente');
  }
  
  // ===== INICIALIZACIÓN DE ELEMENTOS =====
  initializeElements() {
    this.modal = document.getElementById(this.modalId);
    if (!this.modal) {
      console.error(`❌ Modal con ID "${this.modalId}" no encontrado`);
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
    
    // Elementos de thumbnails
    this.thumbnailsContainer = this.modal.querySelector('.lightbox-thumbnails-carousel');
    this.thumbPrevBtn = this.modal.querySelector('.lightbox-thumb-prev');
    this.thumbNextBtn = this.modal.querySelector('.lightbox-thumb-next');
    
    // Botones de acción
    this.detailsLink = this.modal.querySelector('.lightbox-details-link');
    this.reservaLink = this.modal.querySelector('.lightbox-reserva-link');
    
    console.log('🔍 Elementos del lightbox:', {
      modal: !!this.modal,
      image: !!this.image,
      title: !!this.title,
      reservaLink: !!this.reservaLink,
      detailsLink: !!this.detailsLink
    });
  }
  
  // ===== CONFIGURACIÓN DE EVENTOS =====
  bindEvents() {
    if (!this.modal) return;
    
    // Botón cerrar
    this.closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.close();
    });
    
    // Navegación de imágenes
    this.prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateImage(-1);
    });
    
    this.nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateImage(1);
    });
    
    // Navegación de thumbnails
    this.thumbPrevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateThumbnailCarousel(-1);
    });
    
    this.thumbNextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateThumbnailCarousel(1);
    });
    
    // Click fuera del modal para cerrar
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    
    // Teclado
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Responsive
    window.addEventListener('resize', () => this.handleResize());
    
    // ===== EVENTO CRÍTICO: BOTÓN RESERVAR =====
    this.setupReservaButton();
  }
  
  // ===== CONFIGURACIÓN ESPECÍFICA DEL BOTÓN RESERVAR =====
  setupReservaButton() {
    // Remover todos los event listeners previos para evitar duplicados
    if (this.reservaLink) {
      // Clonar el elemento para remover todos los event listeners
      const newReservaLink = this.reservaLink.cloneNode(true);
      this.reservaLink.parentNode?.replaceChild(newReservaLink, this.reservaLink);
      this.reservaLink = newReservaLink;
      
      // Configurar el nuevo event listener
      this.reservaLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎯 Botón reservar clickeado desde lightbox');
        console.log('📋 Estudio actual:', this.currentEstudioId);
        
        // Cerrar lightbox
        this.close();
        
        // Disparar evento de estudio seleccionado
        this.dispatchEstudioSeleccionado();
        
        // Scroll suave a la sección de reservas
        setTimeout(() => this.scrollToReservas(), 300);
      });
      
      console.log('✅ Botón reservar configurado correctamente');
    }
  }
  
  // ===== FUNCIONES PRINCIPALES =====
  open(estudioId, imageIndex = 0) {
    console.log('🎯 Abriendo lightbox para:', { estudioId, imageIndex });
    
    const estudioData = this.lightboxData[estudioId];
    if (!estudioData) {
      console.error('❌ Estudio no encontrado:', estudioId);
      return;
    }
    
    this.currentEstudioId = estudioId;
    this.currentImages = this.buildImageArray(estudioData);
    this.currentImageIndex = Math.max(0, Math.min(imageIndex, this.currentImages.length - 1));
    this.thumbCarouselIndex = 0;
    
    // Actualizar contenido
    this.updateContent(estudioData);
    this.buildThumbnails();
    this.updateImage();
    this.show();
    
    console.log('✅ Lightbox abierto exitosamente');
  }
  
  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
      document.body.style.overflow = '';
      console.log('🔒 Lightbox cerrado');
    }
  }
  
  // ===== ACTUALIZACIÓN DE CONTENIDO =====
  updateContent(estudioData) {
    // Actualizar título
    if (this.title) {
      this.title.textContent = estudioData.nombre || 'Apartaestudio';
    }
    
    // Actualizar enlaces
    if (this.detailsLink) {
      this.detailsLink.href = `/estudio/${this.currentEstudioId}`;
    }
    
    // Configurar botón de reserva nuevamente por si acaso
    this.setupReservaButton();
  }
  
  // ===== CONSTRUCCIÓN DE ARRAY DE IMÁGENES =====
  buildImageArray(estudioData) {
    const images = [];
    
    // Imagen principal
    if (estudioData.imagenPrincipal) {
      images.push(estudioData.imagenPrincipal);
    }
    
    // Imágenes de galería
    if (estudioData.imagenes && Array.isArray(estudioData.imagenes)) {
      images.push(...estudioData.imagenes);
    }
    
    return images;
  }
  
  // ===== NAVEGACIÓN DE IMÁGENES =====
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
  
  // ===== ACTUALIZACIÓN DE IMAGEN PRINCIPAL =====
  updateImage() {
    if (!this.image || !this.currentImages[this.currentImageIndex]) return;
    
    const currentImg = this.currentImages[this.currentImageIndex];
    this.image.src = currentImg;
    this.image.alt = `Imagen ${this.currentImageIndex + 1} del apartaestudio`;
    
    // Actualizar contador
    if (this.currentSpan) this.currentSpan.textContent = this.currentImageIndex + 1;
    if (this.totalSpan) this.totalSpan.textContent = this.currentImages.length;
    
    // Actualizar thumbnails activos
    this.updateActiveThumbnail();
  }
  
  // ===== CONSTRUCCIÓN DE THUMBNAILS =====
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
  
  // ===== ACTUALIZACIÓN DE THUMBNAIL ACTIVO =====
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
    
    console.log('📤 Evento estudioSeleccionado enviado:', {
      estudioId: this.currentEstudioId,
      estudioNombre: estudioData?.nombre
    });
  }
  
  // ===== SCROLL A SECCIÓN RESERVAS =====
  scrollToReservas() {
    const reservasSection = document.querySelector('#reservas');
    if (reservasSection) {
      reservasSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      console.log('⬇️ Scroll a reservas completado');
    } else {
      console.warn('⚠️ Sección #reservas no encontrada');
      // Fallback: intentar scroll a formulario
      const form = document.querySelector('form[data-estudio-form]');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  
  // ===== CONFIGURACIÓN DE HANDLERS GLOBALES =====
  setupGlobalHandlers() {
    // Exponer función global para abrir lightbox
    window.openPixelLightbox = (estudioId, imageIndex = 0) => {
      this.open(estudioId, imageIndex);
    };
    
    // Handler para botones de galería
    document.addEventListener('click', (e) => {
      if (e.target.closest('.open-gallery-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.open-gallery-btn');
        const estudioId = btn.getAttribute('data-estudio-id');
        if (estudioId) {
          this.open(estudioId, 0);
        }
      }
      
      // Handler para thumbnails
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

// =============================================================================
// INICIALIZACIÓN AUTOMÁTICA
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando PixelLightbox...');
  
  // Verificar que lightboxData esté disponible
  const lightboxData = window.lightboxData || {};
  
  if (Object.keys(lightboxData).length === 0) {
    console.warn('⚠️ lightboxData no encontrado o vacío');
  }
  
  // Inicializar lightbox
  window.pixelLightboxInstance = new PixelLightbox('espacios-lightbox', lightboxData);
  
  console.log('✅ PixelLightbox inicializado globalmente');
});

// =============================================================================
// FUNCIONES DE COMPATIBILIDAD (para código existente)
// =============================================================================

// Función global de compatibilidad
window.openLightbox = function(estudioId, imageIndex = 0) {
  if (window.pixelLightboxInstance) {
    window.pixelLightboxInstance.open(estudioId, imageIndex);
  } else {
    console.error('❌ PixelLightbox no está inicializado');
  }
};

// Export para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PixelLightbox;
}