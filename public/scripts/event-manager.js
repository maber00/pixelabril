/**
 * PixelEventManager - Sistema centralizado de manejo de eventos para Pixel Living
 * 
 * Características:
 * - Event delegation desde document
 * - Prevención de listeners duplicados
 * - Cleanup automático de eventos
 * - Debugging y logging integrado
 * - Performance optimizado
 * - Gestión de memoria eficiente
 */

class PixelEventManager {
  constructor() {
    this.eventRegistry = new Map(); // Registro de eventos activos
    this.delegatedEvents = new Map(); // Eventos delegados
    this.components = new Map(); // Componentes registrados
    this.isInitialized = false;
    this.debugMode = false;
    
    // Bind methods
    this.handleDelegatedEvent = this.handleDelegatedEvent.bind(this);
    this.handlePageUnload = this.handlePageUnload.bind(this);
    this.handlePageShow = this.handlePageShow.bind(this);
    
    this.init();
  }

  /**
   * Inicialización del Event Manager
   */
  init() {
    if (this.isInitialized) return;

    // Event delegation principal
    document.addEventListener('click', this.handleDelegatedEvent);
    document.addEventListener('change', this.handleDelegatedEvent);
    document.addEventListener('input', this.handleDelegatedEvent);
    document.addEventListener('submit', this.handleDelegatedEvent);
    document.addEventListener('keydown', this.handleDelegatedEvent);
    document.addEventListener('touchstart', this.handleDelegatedEvent);
    document.addEventListener('touchend', this.handleDelegatedEvent);

    // Lifecycle events
    window.addEventListener('beforeunload', this.handlePageUnload);
    window.addEventListener('pageshow', this.handlePageShow);

    this.isInitialized = true;
    this.log('PixelEventManager inicializado');
  }

  /**
   * Registrar un componente con sus eventos
   */
  registerComponent(componentName, config = {}) {
    if (this.components.has(componentName)) {
      this.log(`Componente '${componentName}' ya registrado, actualizando...`);
    }

    const component = {
      name: componentName,
      selectors: config.selectors || {},
      handlers: config.handlers || {},
      state: config.initialState || {},
      cleanup: config.cleanup || null,
      isActive: true,
      registeredAt: Date.now()
    };

    this.components.set(componentName, component);
    this.log(`Componente '${componentName}' registrado`);

    return component;
  }

  /**
   * Registrar evento delegado
   */
  on(selector, eventType, handler, options = {}) {
    const eventKey = `${eventType}:${selector}`;
    
    if (this.delegatedEvents.has(eventKey) && !options.allowDuplicates) {
      this.log(`Evento duplicado detectado: ${eventKey}`, 'warn');
      return false;
    }

    const eventConfig = {
      selector,
      eventType,
      handler,
      options,
      registeredAt: Date.now(),
      callCount: 0
    };

    this.delegatedEvents.set(eventKey, eventConfig);
    this.log(`Evento registrado: ${eventKey}`);
    
    return eventKey;
  }

  /**
   * Remover evento delegado
   */
  off(eventKey) {
    if (this.delegatedEvents.has(eventKey)) {
      this.delegatedEvents.delete(eventKey);
      this.log(`Evento removido: ${eventKey}`);
      return true;
    }
    return false;
  }

  /**
   * Manejar eventos delegados
   */
  handleDelegatedEvent(e) {
    const eventType = e.type;
    const target = e.target;

    // Buscar eventos que coincidan
    for (const [eventKey, config] of this.delegatedEvents) {
      if (config.eventType !== eventType) continue;

      // Verificar selector
      const element = target.closest(config.selector);
      if (!element) continue;

      // Verificar condiciones adicionales
      if (config.options.condition && !config.options.condition(e, element)) {
        continue;
      }

      try {
        // Incrementar contador de llamadas
        config.callCount++;

        // Ejecutar handler
        const result = config.handler.call(element, e, element);

        // Logging para debug
        this.log(`Evento ejecutado: ${eventKey} (${config.callCount} veces)`);

        // Verificar si se debe prevenir default o propagación
        if (config.options.preventDefault) {
          e.preventDefault();
        }
        if (config.options.stopPropagation) {
          e.stopPropagation();
        }

        // Si el handler retorna false, detener procesamiento
        if (result === false) {
          break;
        }

      } catch (error) {
        console.error(`Error en evento ${eventKey}:`, error);
      }
    }
  }

  /**
   * Inicializar carrusel (reemplaza lógica duplicada)
   */
  initCarousel(containerId, options = {}) {
    const config = {
      slidesPerView: { mobile: 1, tablet: 2, desktop: 3 },
      autoplay: false,
      autoplayDelay: 5000,
      enableTouch: true,
      enableKeyboard: true,
      ...options
    };

    const componentName = `carousel-${containerId}`;
    
    // State del carrusel
    const carouselState = {
      currentIndex: 0,
      totalSlides: 0,
      slidesPerView: 1,
      isAnimating: false,
      autoplayTimer: null,
      touchStartX: 0,
      touchEndX: 0
    };

    // Registrar componente
    this.registerComponent(componentName, {
      selectors: {
        container: `#${containerId}`,
        slides: `#${containerId} [data-carousel-slides]`,
        prevBtn: `#${containerId} [data-carousel-prev]`,
        nextBtn: `#${containerId} [data-carousel-next]`,
        indicators: `#${containerId} [data-carousel-indicator]`
      },
      initialState: carouselState,
      cleanup: () => {
        if (carouselState.autoplayTimer) {
          clearInterval(carouselState.autoplayTimer);
        }
      }
    });

    // Eventos del carrusel
    this.on(`#${containerId} [data-carousel-prev]`, 'click', (e, element) => {
      e.preventDefault();
      this.carouselNavigate(componentName, -1);
    });

    this.on(`#${containerId} [data-carousel-next]`, 'click', (e, element) => {
      e.preventDefault();
      this.carouselNavigate(componentName, 1);
    });

    this.on(`#${containerId} [data-carousel-indicator]`, 'click', (e, element) => {
      e.preventDefault();
      const index = parseInt(element.dataset.carouselIndicator);
      this.carouselGoTo(componentName, index);
    });

    // Touch events para móviles
    if (config.enableTouch) {
      this.on(`#${containerId}`, 'touchstart', (e, element) => {
        carouselState.touchStartX = e.touches[0].screenX;
      });

      this.on(`#${containerId}`, 'touchend', (e, element) => {
        carouselState.touchEndX = e.changedTouches[0].screenX;
        this.handleCarouselSwipe(componentName);
      });
    }

    // Inicializar carrusel
    this.carouselUpdate(componentName);

    // Autoplay si está habilitado
    if (config.autoplay) {
      this.carouselStartAutoplay(componentName, config.autoplayDelay);
    }

    // Responsive
    this.on(window, 'resize', () => {
      this.carouselUpdateResponsive(componentName, config);
    });

    return componentName;
  }

  /**
   * Navegación de carrusel
   */
  carouselNavigate(componentName, direction) {
    const component = this.components.get(componentName);
    if (!component || component.state.isAnimating) return;

    const state = component.state;
    const newIndex = state.currentIndex + direction;
    
    if (newIndex >= 0 && newIndex <= state.totalSlides - state.slidesPerView) {
      state.currentIndex = newIndex;
      this.carouselUpdate(componentName);
    }
  }

  /**
   * Ir a slide específico
   */
  carouselGoTo(componentName, index) {
    const component = this.components.get(componentName);
    if (!component) return;

    const state = component.state;
    if (index >= 0 && index <= state.totalSlides - state.slidesPerView) {
      state.currentIndex = index;
      this.carouselUpdate(componentName);
    }
  }

  /**
   * Actualizar carrusel
   */
  carouselUpdate(componentName) {
    const component = this.components.get(componentName);
    if (!component) return;

    const state = component.state;
    const container = document.querySelector(component.selectors.container);
    const slides = document.querySelector(component.selectors.slides);
    
    if (!container || !slides) return;

    // Calcular dimensiones
    const slideWidth = container.clientWidth / state.slidesPerView;
    const totalSlides = slides.children.length;
    state.totalSlides = totalSlides;

    // Animar
    state.isAnimating = true;
    slides.style.transform = `translateX(-${state.currentIndex * slideWidth}px)`;

    // Actualizar botones
    const prevBtn = document.querySelector(component.selectors.prevBtn);
    const nextBtn = document.querySelector(component.selectors.nextBtn);
    
    if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
    if (nextBtn) nextBtn.disabled = state.currentIndex >= totalSlides - state.slidesPerView;

    // Actualizar indicadores
    const indicators = document.querySelectorAll(component.selectors.indicators);
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === state.currentIndex);
    });

    // Reset animación
    setTimeout(() => {
      state.isAnimating = false;
    }, 300);
  }

  /**
   * Manejar swipe en carrusel
   */
  handleCarouselSwipe(componentName) {
    const component = this.components.get(componentName);
    if (!component) return;

    const state = component.state;
    const threshold = 50;
    const diff = state.touchStartX - state.touchEndX;

    if (Math.abs(diff) > threshold) {
      this.carouselNavigate(componentName, diff > 0 ? 1 : -1);
    }
  }

  /**
   * Inicializar formulario
   */
  initForm(formId, options = {}) {
    const config = {
      validateOnInput: true,
      submitHandler: null,
      resetAfterSubmit: true,
      showLoadingState: true,
      ...options
    };

    const componentName = `form-${formId}`;
    
    const formState = {
      isSubmitting: false,
      errors: {},
      isValid: false
    };

    this.registerComponent(componentName, {
      selectors: {
        form: `#${formId}`,
        inputs: `#${formId} input, #${formId} textarea, #${formId} select`,
        submitBtn: `#${formId} [type="submit"]`
      },
      initialState: formState
    });

    // Submit handler
    this.on(`#${formId}`, 'submit', async (e, form) => {
      e.preventDefault();
      
      if (formState.isSubmitting) return;

      formState.isSubmitting = true;
      this.updateFormLoadingState(componentName, true);

      try {
        if (config.submitHandler) {
          await config.submitHandler(new FormData(form), form);
        }

        if (config.resetAfterSubmit) {
          form.reset();
        }

        this.log(`Formulario ${formId} enviado exitosamente`);

      } catch (error) {
        console.error(`Error en formulario ${formId}:`, error);
      } finally {
        formState.isSubmitting = false;
        this.updateFormLoadingState(componentName, false);
      }
    });

    // Validación en tiempo real
    if (config.validateOnInput) {
      this.on(`#${formId} input, #${formId} textarea, #${formId} select`, 'input', (e, input) => {
        this.validateFormField(componentName, input);
      });
    }

    return componentName;
  }

  /**
   * Actualizar estado de carga del formulario
   */
  updateFormLoadingState(componentName, isLoading) {
    const component = this.components.get(componentName);
    if (!component) return;

    const submitBtn = document.querySelector(component.selectors.submitBtn);
    if (!submitBtn) return;

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      const originalText = submitBtn.textContent;
      submitBtn.dataset.originalText = originalText;
      submitBtn.textContent = 'Enviando...';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  }

  /**
   * Validar campo de formulario
   */
  validateFormField(componentName, input) {
    // Lógica básica de validación
    const isValid = input.checkValidity();
    const component = this.components.get(componentName);
    
    if (component) {
      component.state.errors[input.name] = isValid ? null : input.validationMessage;
    }

    // Actualizar UI
    input.classList.toggle('error', !isValid);
    input.classList.toggle('valid', isValid);
  }

  /**
   * Limpiar eventos de un componente
   */
  cleanupComponent(componentName) {
    const component = this.components.get(componentName);
    if (!component) return;

    // Ejecutar cleanup personalizado
    if (component.cleanup) {
      component.cleanup();
    }

    // Marcar como inactivo
    component.isActive = false;

    // Remover eventos relacionados
    for (const [eventKey, config] of this.delegatedEvents) {
      if (eventKey.includes(componentName) || config.selector.includes(componentName)) {
        this.delegatedEvents.delete(eventKey);
      }
    }

    this.log(`Componente '${componentName}' limpiado`);
  }

  /**
   * Cleanup general al salir de la página
   */
  handlePageUnload() {
    this.log('Limpiando eventos antes de salir de la página');
    
    // Limpiar todos los componentes
    for (const [componentName] of this.components) {
      this.cleanupComponent(componentName);
    }

    // Limpiar timers y referencias
    this.delegatedEvents.clear();
    this.components.clear();
  }

  /**
   * Re-inicializar al volver a la página
   */
  handlePageShow(e) {
    if (e.persisted) {
      this.log('Página restaurada desde cache, re-inicializando eventos');
      // Re-inicializar componentes si es necesario
    }
  }

  /**
   * Obtener estadísticas de eventos
   */
  getStats() {
    const stats = {
      totalEvents: this.delegatedEvents.size,
      totalComponents: this.components.size,
      eventCallCounts: {},
      componentStates: {}
    };

    // Contadores de eventos
    for (const [eventKey, config] of this.delegatedEvents) {
      stats.eventCallCounts[eventKey] = config.callCount;
    }

    // Estados de componentes
    for (const [name, component] of this.components) {
      stats.componentStates[name] = {
        isActive: component.isActive,
        registeredAt: component.registeredAt,
        state: component.state
      };
    }

    return stats;
  }

  /**
   * Habilitar/deshabilitar debug
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.log(`Debug mode ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  /**
   * Logging interno
   */
  log(message, type = 'info') {
    if (!this.debugMode && type !== 'error') return;

    const prefix = '[PixelEventManager]';
    switch (type) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }

  /**
   * Destruir el Event Manager
   */
  destroy() {
    this.handlePageUnload();
    
    // Remover event listeners principales
    document.removeEventListener('click', this.handleDelegatedEvent);
    document.removeEventListener('change', this.handleDelegatedEvent);
    document.removeEventListener('input', this.handleDelegatedEvent);
    document.removeEventListener('submit', this.handleDelegatedEvent);
    document.removeEventListener('keydown', this.handleDelegatedEvent);
    document.removeEventListener('touchstart', this.handleDelegatedEvent);
    document.removeEventListener('touchend', this.handleDelegatedEvent);
    
    window.removeEventListener('beforeunload', this.handlePageUnload);
    window.removeEventListener('pageshow', this.handlePageShow);

    this.isInitialized = false;
    this.log('PixelEventManager destruido');
  }
}

// Crear instancia global
window.PixelEventManager = new PixelEventManager();

// Debug helper
window.PixelEventManager.setDebugMode(false); // Cambiar a true para debug

// Alias para facilidad de uso
window.PEM = window.PixelEventManager;

console.log('PixelEventManager cargado y listo para usar');