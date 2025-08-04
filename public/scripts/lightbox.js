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
      console.log('PixelLightbox: Constructor iniciado con opciones:', options);
      
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
        console.error(`PixelLightbox: No se encontró elemento con ID ${this.options.modalId}`);
        return;
      }
  
      console.log('PixelLightbox: Modal encontrado:', this.modal);
  
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
  
      // Verificar que se encontraron los elementos necesarios
      console.log('PixelLightbox: Elementos encontrados:', {
        image: !!this.image,
        title: !!this.title,
        thumbnails: !!this.thumbnailsContainer,
        closeButton: !!this.closeButton,
        prevButton: !!this.prevButton,
        nextButton: !!this.nextButton
      });
  
      // Event listeners
      this.setupEventListeners();
      
    }
  
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
      // Botón cerrar
      if (this.closeButton) {
        this.closeButton.addEventListener('click', (e) => {
          console.log('PixelLightbox: Botón cerrar clickeado');
          e.preventDefault();
          this.close();
        });
      }
  
      // Navegación: anterior
      if (this.prevButton) {
        this.prevButton.addEventListener('click', () => {
          console.log('PixelLightbox: Botón anterior clickeado');
          this.navigate(-1);
        });
      }
  
      // Navegación: siguiente
      if (this.nextButton) {
        this.nextButton.addEventListener('click', () => {
          console.log('PixelLightbox: Botón siguiente clickeado');
          this.navigate(1);
        });
      }
  
      // Cerrar con tecla ESC y navegar con flechas
      document.addEventListener('keydown', (e) => {
        if (!this.modal || getComputedStyle(this.modal).display === 'none') return;
        
        if (e.key === 'Escape') {
          console.log('PixelLightbox: Tecla ESC presionada');
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
          console.log('PixelLightbox: Clic fuera del contenido');
          this.close();
        }
      });
  
      // Botón de reserva
      if (this.reservaLink) {
        this.reservaLink.addEventListener('click', () => {
          console.log('PixelLightbox: Botón reserva clickeado');
          this.close();
          
          // Ejecutar callback si existe
          if (typeof this.options.onReservaClick === 'function') {
            setTimeout(() => {
              this.options.onReservaClick(this.currentId);
            }, 300);
          }
        });
      }
    }
  
    /**
     * Abre el lightbox
     * @param {string} id - ID del elemento a mostrar
     * @param {number} startIndex - Índice de la imagen inicial
     */
    open(id, startIndex = 0) {
      console.log('PixelLightbox: Abriendo', id, startIndex);
      
      const dataSource = this.options.dataSource;
      
      // Verificar que existan datos para el ID
      if (!dataSource[id]) {
        console.error('PixelLightbox: ID no encontrado en la fuente de datos', id, dataSource);
        return;
      }
      
      // Obtener los datos del item seleccionado
      const selectedItem = dataSource[id];
      
      // Actualizar estado
      this.currentId = id;
      this.currentIndex = startIndex;
      
      // Preparar imágenes (concatenar imagen principal con galería)
      this.currentImages = [selectedItem.imagenPrincipal, ...selectedItem.imagenes];
      console.log('PixelLightbox: Imágenes cargadas:', this.currentImages.length);
      
      // Actualizar título
      if (this.title) {
        this.title.textContent = selectedItem.nombre;
      }
      
      // Actualizar enlaces
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
      
      // Mostrar la imagen inicial
      this.updateImage();
      
      // Mostrar el modal
      this.modal.classList.remove('hidden');
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Prevenir scroll
      
      console.log('PixelLightbox: Lightbox abierto correctamente');
    }
  
    /**
     * Cierra el lightbox
     */
    close() {
      console.log('PixelLightbox: Cerrando lightbox');
      
      if (this.modal) {
        this.modal.classList.add('hidden');
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaurar scroll
        console.log('PixelLightbox: Lightbox cerrado correctamente');
      }
    }
  
    /**
     * Navega entre las imágenes
     * @param {number} direction - Dirección (1: siguiente, -1: anterior)
     */
    navigate(direction) {
      this.currentIndex = (this.currentIndex + direction + this.currentImages.length) % this.currentImages.length;
      console.log('PixelLightbox: Navegando a imagen', this.currentIndex + 1);
      this.updateImage();
    }
  
    /**
     * Actualiza la imagen mostrada
     */
    updateImage() {
      if (!this.image) return;
      
      // Actualizar imagen principal
      const imgSrc = this.currentImages[this.currentIndex];
      this.image.src = imgSrc;
      console.log('PixelLightbox: Imagen actualizada', imgSrc);
      
      // Actualizar contador
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
      
      // Limpiar contenedor
      this.thumbnailsContainer.innerHTML = '';
      console.log('PixelLightbox: Generando', this.currentImages.length, 'miniaturas');
      
      // Generar miniaturas
      this.currentImages.forEach((imgSrc, index) => {
        const thumb = document.createElement('div');
        thumb.className = `cursor-pointer ${index === this.currentIndex ? 'border-white border-2' : 'border-gray-500 opacity-70'} lightbox-thumb`;
        thumb.innerHTML = `<img src="${imgSrc}" alt="Miniatura ${index + 1}" class="w-16 h-16 object-cover rounded-md">`;
        
        // Event listener para cambiar de imagen
        thumb.addEventListener('click', () => {
          this.currentIndex = index;
          this.updateImage();
        });
        
        this.thumbnailsContainer.appendChild(thumb);
      });
    }
  
    /**
     * Obtiene el ID actual del lightbox
     * @returns {string} ID actual
     */
    getCurrentId() {
      return this.currentId;
    }
  }
  
  // Exportar la clase al objeto window para que esté disponible globalmente
  window.PixelLightbox = PixelLightbox;
  console.log('PixelLightbox: Clase registrada globalmente como window.PixelLightbox');