/**
 * Espacios.js - Script para la funcionalidad de la sección de espacios
 * 
 * Este script se encarga de manejar:
 * 1. El carrusel de apartaestudios
 * 2. El lightbox/galería modal
 * 3. La navegación entre imágenes
 * 4. La comunicación con la sección de reservas
 */

document.addEventListener('DOMContentLoaded', () => {
    // ===== DATOS =====
    
    // Datos de los estudios para el lightbox
    const estudiosData = {
      'jade': {
        nombre: 'Estudio Jade',
        imagenPrincipal: '/images/estudios/f1.jpg',
        imagenes: ['/images/estudios/jade/jade-1.jpg', '/images/estudios/jade/jade-2.jpg', '/images/estudios/jade/jade-3.jpg'],
        color: 'bg-green-500'
      },
      'zian': {
        nombre: 'Estudio Zian',
        imagenPrincipal: '/images/estudios/f2.jpg',
        imagenes: ['/images/estudios/zian/zian-1.jpg', '/images/estudios/zian/zian-2.jpg', '/images/estudios/zian/zian-3.jpg'],
        color: 'bg-blue-500'
      },
      'indigo': {
        nombre: 'Estudio Índigo',
        imagenPrincipal: '/images/estudios/f3.jpg',
        imagenes: ['/images/estudios/indigo/indigo-1.jpg', '/images/estudios/indigo/indigo-2.jpg', '/images/estudios/indigo/indigo-3.jpg'],
        color: 'bg-indigo-500'
      },
      'ambar': {
        nombre: 'Estudio Ámbar',
        imagenPrincipal: '/images/estudios/f4.jpg',
        imagenes: ['/images/estudios/ambar/ambar-1.jpg', '/images/estudios/ambar/ambar-2.jpg', '/images/estudios/ambar/ambar-3.jpg'],
        color: 'bg-amber-500'
      }
    };
  
    // ===== ELEMENTOS DOM =====
    
    // Elementos del carrusel
    const container = document.getElementById('carousel-container');
    const slides = document.getElementById('carousel-slides');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const indicators = document.querySelectorAll('#carousel-indicators button');
    
    // Elementos del lightbox
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxThumbnails = document.getElementById('lightboxThumbnails');
    const closeLightbox = document.getElementById('closeLightbox');
    const prevLightboxImage = document.getElementById('prevLightboxImage');
    const nextLightboxImage = document.getElementById('nextLightboxImage');
    const lightboxDetailsLink = document.getElementById('lightboxDetailsLink');
    const lightboxReservaLink = document.getElementById('lightboxReservaLink');
    
    // Verificar que existan los elementos esenciales del carrusel
    if (!container || !slides || !prevBtn || !nextBtn) return;
    
    // ===== VARIABLES =====
    
    // Variables para el carrusel
    let currentIndex = 0;
    let slidesPerView = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const totalSlides = indicators.length;
    
    // Variables para el lightbox
    let currentEstudioId = '';
    let currentImageIndex = 0;
    let currentEstudioImages = [];
  
    // ===== FUNCIONES CARRUSEL =====
    
    // Funcionamiento del carrusel
    function updateCarousel() {
      // Actualizar la posición del carrusel
      const slideWidth = container.clientWidth / slidesPerView;
      slides.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      
      // Actualizar visibilidad de botones
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === totalSlides - slidesPerView;
      
      // Actualizar indicadores
      indicators.forEach((indicator, index) => {
        if (index === currentIndex) {
          indicator.classList.add('bg-pixel-blue');
          indicator.classList.remove('bg-gray-200');
        } else {
          indicator.classList.add('bg-gray-200');
          indicator.classList.remove('bg-pixel-blue');
        }
      });
      
      // Actualizar visibilidad de slides
      const slideElements = document.querySelectorAll('[data-slide-index]');
      slideElements.forEach((slide, index) => {
        if (index >= currentIndex && index < currentIndex + slidesPerView) {
          slide.classList.remove('opacity-50');
        } else {
          slide.classList.add('opacity-50');
        }
      });
    }
    
    // ===== FUNCIONES LIGHTBOX =====
    
    // Función para navegar entre imágenes
    function navigateLightboxImage(direction) {
      currentImageIndex = (currentImageIndex + direction + currentEstudioImages.length) % currentEstudioImages.length;
      updateLightboxImage();
    }
    
    // Función para actualizar la imagen del lightbox
    function updateLightboxImage() {
      if (!lightboxImage) return;
      
      const imgSrc = currentEstudioImages[currentImageIndex];
      lightboxImage.src = imgSrc;
      
      // Actualizar miniaturas activas
      const thumbs = lightboxThumbnails?.querySelectorAll('.lightbox-thumb');
      if (thumbs) {
        thumbs.forEach((thumb, index) => {
          if (index === currentImageIndex) {
            thumb.classList.remove('border-white', 'border-2');
          thumb.classList.add('border-gray-500', 'opacity-70');
        }
      });
    }
  }
  
  // Función para abrir el lightbox
  function openLightbox(estudioId, startIndex) {
    // Verificar que exista el estudio
    if (!estudiosData[estudioId]) {
      console.error('Estudio no encontrado:', estudioId);
      return;
    }
    
    if (!lightboxModal || !lightboxImage || !lightboxTitle || !lightboxThumbnails) return;
    
    // Almacenar datos del estudio actual
    const estudioSeleccionado = estudiosData[estudioId];
    currentEstudioId = estudioId;
    currentImageIndex = startIndex || 0;
    
    // Combinar imagen principal con imágenes de galería
    currentEstudioImages = [estudioSeleccionado.imagenPrincipal].concat(estudioSeleccionado.imagenes);
    
    // Actualizar título
    lightboxTitle.textContent = estudioSeleccionado.nombre;
    
    // Actualizar enlaces
    if (lightboxDetailsLink) {
      lightboxDetailsLink.href = `/estudio/${estudioId}`;
    }
    
    if (lightboxReservaLink) {
      // Resetear event listeners anteriores
      const newLightboxReservaLink = lightboxReservaLink.cloneNode(true);
      lightboxReservaLink.parentNode.replaceChild(newLightboxReservaLink, lightboxReservaLink);
      
      // Configurar el nuevo enlace
      newLightboxReservaLink.setAttribute('data-estudio-id', estudioId);
      newLightboxReservaLink.addEventListener('click', () => {
        lightboxModal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Dar tiempo para que se cierre el modal antes de establecer el estudio seleccionado
        setTimeout(() => {
          // Informar a la sección de reservas qué estudio se seleccionado
          const event = new CustomEvent('estudioSeleccionado', { 
            detail: { 
              estudioId: estudioId, 
              estudioNombre: estudioSeleccionado.nombre 
            }
          });
          document.dispatchEvent(event);
        }, 300);
      });
    }
    
    // Generar miniaturas
    lightboxThumbnails.innerHTML = '';
    currentEstudioImages.forEach((imgSrc, index) => {
      const thumb = document.createElement('div');
      thumb.className = `cursor-pointer ${index === currentImageIndex ? 'border-white border-2' : 'border-gray-500 opacity-70'} lightbox-thumb`;
      thumb.innerHTML = `<img src="${imgSrc}" alt="Miniatura ${index + 1}" class="w-16 h-16 object-cover rounded-md">`;
      
      thumb.addEventListener('click', () => {
        currentImageIndex = index;
        updateLightboxImage();
      });
      
      lightboxThumbnails.appendChild(thumb);
    });
    
    // Mostrar imagen inicial
    updateLightboxImage();
    
    // Mostrar lightbox
    lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
  }

  // ===== INICIALIZACIÓN Y EVENT LISTENERS =====
  
  // Inicializar carrusel
  updateCarousel();
  
  // Eventos del carrusel
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentIndex < totalSlides - slidesPerView) {
      currentIndex++;
      updateCarousel();
    }
  });
  
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      currentIndex = Math.min(index, totalSlides - slidesPerView);
      updateCarousel();
    });
  });
  
  // Actualizar en cambio de tamaño de ventana
  window.addEventListener('resize', () => {
    const newSlidesPerView = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    if (newSlidesPerView !== slidesPerView) {
      slidesPerView = newSlidesPerView;
      currentIndex = Math.min(currentIndex, totalSlides - slidesPerView);
      updateCarousel();
    }
  });
  
  // Eventos de lightbox
  const openGalleryBtns = document.querySelectorAll('.open-gallery-btn');
  openGalleryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const estudioId = btn.getAttribute('data-estudio-id') || '';
      openLightbox(estudioId, 0);
    });
  });
  
  // Abrir lightbox desde miniaturas
  const galleryThumbs = document.querySelectorAll('.gallery-thumb');
  galleryThumbs.forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const estudioId = thumb.getAttribute('data-estudio-id') || '';
      const imgIndex = parseInt(thumb.getAttribute('data-img-index') || '0');
      openLightbox(estudioId, imgIndex);
    });
  });
  
  // Abrir lightbox desde imagen principal
  const mainImages = document.querySelectorAll('.main-image');
  mainImages.forEach(img => {
    img.addEventListener('click', (e) => {
      // Prevenir apertura si se clickeó en elementos internos
      if (e.target !== img) return;
      
      const estudioId = img.getAttribute('data-estudio-id') || '';
      openLightbox(estudioId, 0);
    });
  });
  
  // Cerrar lightbox
  closeLightbox?.addEventListener('click', () => {
    lightboxModal?.classList.add('hidden');
    document.body.style.overflow = '';
  });
  
  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (lightboxModal?.classList.contains('hidden')) return;
    
    if (e.key === 'Escape') {
      lightboxModal.classList.add('hidden');
      document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft') {
      navigateLightboxImage(-1);
    } else if (e.key === 'ArrowRight') {
      navigateLightboxImage(1);
    }
  });
  
  // Botones de navegación para lightbox
  prevLightboxImage?.addEventListener('click', () => navigateLightboxImage(-1));
  nextLightboxImage?.addEventListener('click', () => navigateLightboxImage(1));
  
  // Prevenir propagación de clics
  document.querySelectorAll('.gallery-thumb, .open-gallery-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
});