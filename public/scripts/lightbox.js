/**
 * Clase para manejar el comportamiento del lightbox de imágenes
 * Este archivo debe colocarse en public/scripts/lightbox.js
 */
class PixelLightbox {
    /**
     * Inicializa el lightbox
     * @param {Object} options - Opciones de configuración
     * @param {string} options.modalId - ID del modal del lightbox
     * @param {Object} options.dataSource - Fuente de datos para las imágenes y títulos
     * @param {function} options.onReservaClick - Función callback para el botón de reserva
     * @param {string} options.detailsPath - Ruta base para el enlace de detalles
     * @param {string} options.reservaPath - Ruta para el enlace de reserva
     */
    constructor(options = {}) {
      
      // Opciones por defecto
      this.options = {
        modalId: 'lightboxModal',
        dataSource: {},
        onReservaClick: null,
        detailsPath: '/estudio/',
        reservaPath: '#reservas',
        ...options
      };
  
      // Estado
      this.currentId = '';
      this.currentIndex = 0;
      this.currentImages = [];
      
      // Inicializar
      this.init();
    }
  
    /**
     * Inicializa el lightbox y los event listeners
     */
    init() {
      // Referencias a elementos DOM
      this.modal = document.getElementById(this.options.modalId);
      if (!this.modal) {
        return;
      }
  
  
      // Encontrar elementos dentro del modal usando clases específicas
      this.image = this.modal.querySelector('.lightbox-image');
      this.title = this.modal.querySelector('.lightbox-title');
      this.thumbnailsContainer = this.modal.querySelector('.lightbox-thumbnails');
      this.closeButton = this.modal.querySelector('.lightbox-close');
      this.prevButton = this.modal.querySelector('.lightbox-prev');
      this.nextButton = this.modal.querySelector('.lightbox-next');
      this.detailsLink = this.modal.querySelector('.lightbox-details-link');
      this.reservaLink = this.modal.querySelector('.lightbox-reserva-link');
      this.currentSlideElement = this.modal.querySelector('.lightbox-current');
      this.totalSlidesElement = this.modal.querySelector('.lightbox-total');
  
   
  
      this.setupEventListeners();
      
    }
  
   
    setupEventListeners() {
      if (this.closeButton) {
        this.closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      }
  
      // Navegación: anterior
      if (this.prevButton) {
        this.prevButton.addEventListener('click', () => {
          this.navigate(-1);
        });
      }
  
      // Navegación: siguiente
      if (this.nextButton) {
        this.nextButton.addEventListener('click', () => {
          this.navigate(1);
        });
      }
  
      // Cerrar con tecla ESC y navegar con flechas
      document.addEventListener('keydown', (e) => {
        if (!this.modal || getComputedStyle(this.modal).display === 'none') return;
        
        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'ArrowLeft') {
          this.navigate(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigate(1);
        }
      });
  
      // Cerrar si se hace clic fuera del contenido
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
  
      if (this.reservaLink) {
        this.reservaLink.addEventListener('click', () => {
          this.close();
          
          if (typeof this.options.onReservaClick === 'function') {
            setTimeout(() => {
              this.options.onReservaClick(this.currentId);
            }, 300);
          }
        });
      }
    }
  
    /**
     * @param {string} id 
     * @param {number} startIndex 
     */
    open(id, startIndex = 0) {
      
      const dataSource = this.options.dataSource;
      
      if (!dataSource[id]) {
        return;
      }
      
      const selectedItem = dataSource[id];
      
      this.currentId = id;
      this.currentIndex = startIndex;
      
      this.currentImages = [selectedItem.imagenPrincipal, ...selectedItem.imagenes];
      
      if (this.title) {
        this.title.textContent = selectedItem.nombre;
      }
      
      if (this.detailsLink) {
        this.detailsLink.href = `${this.options.detailsPath}${id}`;
      }
      
      if (this.reservaLink) {
        this.reservaLink.setAttribute('data-id', id);
        this.reservaLink.href = this.options.reservaPath;
      }
      
      // Generar miniaturas
      this.renderThumbnails();
      
      // Actualizar contador de imágenes
      if (this.totalSlidesElement) {
        this.totalSlidesElement.textContent = this.currentImages.length;
      }
      
      this.updateImage();
      
      this.modal.classList.remove('hidden');
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Prevenir scroll
      
    }
  
    
    close() {
      
      if (this.modal) {
        this.modal.classList.add('hidden');
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; 
      }
    }
  
    /**
     * @param {number} direction 
     */
    navigate(direction) {
      this.currentIndex = (this.currentIndex + direction + this.currentImages.length) % this.currentImages.length;
      this.updateImage();
    }
  
    /**
     */
    updateImage() {
      if (!this.image) return;
      
      const imgSrc = this.currentImages[this.currentIndex];
      this.image.src = imgSrc;
      
      if (this.currentSlideElement) {
        this.currentSlideElement.textContent = (this.currentIndex + 1).toString();
      }
      
      // Actualizar miniaturas activas
      const thumbs = this.thumbnailsContainer?.querySelectorAll('.lightbox-thumb');
      if (thumbs) {
        thumbs.forEach((thumb, index) => {
          if (index === this.currentIndex) {
            thumb.classList.add('border-white', 'border-2');
            thumb.classList.remove('border-gray-500', 'opacity-70');
          } else {
            thumb.classList.remove('border-white', 'border-2');
            thumb.classList.add('border-gray-500', 'opacity-70');
          }
        });
      }
    }
  
    /**
     * Genera las miniaturas de las imágenes
     */
    renderThumbnails() {
      if (!this.thumbnailsContainer) return;
      
      this.thumbnailsContainer.innerHTML = '';
      
      this.currentImages.forEach((imgSrc, index) => {
        const thumb = document.createElement('div');
        thumb.className = `cursor-pointer ${index === this.currentIndex ? 'border-white border-2' : 'border-gray-500 opacity-70'} lightbox-thumb`;
        thumb.innerHTML = `<img src="${imgSrc}" alt="Miniatura ${index + 1}" class="w-16 h-16 object-cover rounded-md">`;
        
        thumb.addEventListener('click', () => {
          this.currentIndex = index;
          this.updateImage();
        });
        
        this.thumbnailsContainer.appendChild(thumb);
      });
    }
  
    /**
     * @returns {string} ID actual
     */
    getCurrentId() {
      return this.currentId;
    }
  }
  
  window.PixelLightbox = PixelLightbox;
