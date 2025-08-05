/**
 * PixelStateManager - Sistema centralizado de estados UX
 * 
 * Maneja:
 * - Estados de carga (loading, success, error)
 * - Skeleton screens
 * - Progress indicators
 * - Error recovery
 * - Mobile optimization
 * - Performance monitoring
 */

class PixelStateManager {
  constructor() {
    this.states = new Map(); // Tracking de estados por componente
    this.loadingElements = new Map(); // Elementos de carga
    this.errorHandlers = new Map(); // Manejadores de error
    this.config = {
      // Configuración de estados
      loadingDelay: 200, // Delay antes de mostrar loading
      errorRetryDelay: 1000, // Delay para retry automático
      maxRetries: 3, // Máximo intentos de retry
      skeletonDuration: 800, // Duración mínima del skeleton
      // Mobile optimization
      isMobile: window.innerWidth <= 768,
      isTouch: 'ontouchstart' in window,
      // Performance monitoring
      performanceThreshold: 3000, // ms para considerar lento
      connectionType: this.getConnectionType()
    };
    
    this.isInitialized = false;
    this.performanceMetrics = {
      loadTimes: [],
      errors: [],
      retries: 0,
      touchInteractions: 0
    };
    
    this.init();
  }

  /**
   * Inicialización del sistema
   */
  init() {
    if (this.isInitialized) return;

    // Detectar capacidades del dispositivo
    this.detectDeviceCapabilities();
    
    // Configurar observers para performance
    this.setupPerformanceObservers();
    
    // Event listeners globales
    this.bindGlobalEvents();
    
    // Mobile optimizations
    if (this.config.isMobile) {
      this.initMobileOptimizations();
    }
    
    this.isInitialized = true;
    
  }


  detectDeviceCapabilities() {
    this.config.connectionType = this.getConnectionType();
    
    this.config.isLowEnd = this.isLowEndDevice();
    
    this.config.supportsIntersectionObserver = 'IntersectionObserver' in window;
    this.config.supportsServiceWorker = 'serviceWorker' in navigator;
    this.config.supportsWebP = this.checkWebPSupport();
    
    if (this.config.isLowEnd) {
      this.config.loadingDelay = 100;
      this.config.skeletonDuration = 400;
    }
    
    if (this.config.connectionType === 'slow') {
      this.config.errorRetryDelay = 2000;
      this.config.maxRetries = 2;
    }
  }

  getConnectionType() {
    if (!navigator.connection) return 'unknown';
    
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    } else if (effectiveType === '3g') {
      return 'medium';
    } else {
      return 'fast';
    }
  }

  /**
   * Detectar dispositivos de baja gama
   */
  isLowEndDevice() {
    // Heurísticas para detectar dispositivos lentos
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = navigator.deviceMemory || 4;
    
    return hardwareConcurrency <= 2 || deviceMemory <= 2;
  }

  /**
   * Verificar soporte WebP
   */
  checkWebPSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Configurar observers de performance
   */
  setupPerformanceObservers() {
    // Performance Observer para Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.performanceMetrics.lcp = lastEntry.startTime;
        
        if (lastEntry.startTime > this.config.performanceThreshold) {
          this.handleSlowPerformance('lcp', lastEntry.startTime);
        }
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Soporte limitado
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.performanceMetrics.fid = entry.processingStart - entry.startTime;
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Soporte limitado
      }
    }
  }

 
  handleSlowPerformance(metric, value) {
    
    if (metric === 'lcp') {
      this.enableLowPerformanceMode();
    }
  }

  
  enableLowPerformanceMode() {
    
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    document.querySelectorAll('.pixel-hover').forEach(el => {
      el.classList.add('no-hover-effects');
    });
    
    document.body.classList.add('reduced-motion');
  }


  bindGlobalEvents() {
    window.addEventListener('error', (e) => {
      this.handleGlobalError('javascript', e);
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.handleGlobalError('promise', e);
    });

    window.addEventListener('online', () => {
      this.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false);
    });

    window.addEventListener('resize', this.debounce(() => {
      const wasMobile = this.config.isMobile;
      this.config.isMobile = window.innerWidth <= 768;
      
      if (wasMobile !== this.config.isMobile) {
        this.handleViewportChange();
      }
    }, 250));

    // Visibility change para pausar animaciones
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseNonCriticalAnimations();
      } else {
        this.resumeAnimations();
      }
    });
  }

  
  initMobileOptimizations() {
    
    this.setupTouchFeedback();
    
   
    this.setupSwipeGestures();
    
    this.setupScrollOptimization();
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.enableReducedMotion();
    }

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      this.setupiOSOptimizations();
    }
  }


  setupTouchFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }
      
      .touch-feedback::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
        pointer-events: none;
      }
      
      .touch-feedback.active::after {
        width: 200px;
        height: 200px;
      }
    `;
    document.head.appendChild(style);

    // Aplicar a elementos interactivos
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, a, [role="button"]');
      if (target && !target.disabled) {
        target.classList.add('touch-feedback', 'active');
        setTimeout(() => {
          target.classList.remove('active');
        }, 600);
      }
    }, { passive: true });
  }

  /**
   * Configurar gestos swipe mejorados
   */
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      
      this.performanceMetrics.touchInteractions++;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;
      
      // Detectar swipe (mínimo 50px, máximo 500ms)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100 && deltaTime < 500) {
        const direction = deltaX > 0 ? 'right' : 'left';
        this.handleSwipeGesture(e.target, direction, deltaX);
      }
    }, { passive: true });
  }

  /**
   * Manejar gestos swipe
   */
  handleSwipeGesture(target, direction, distance) {
    // Buscar el carrusel más cercano
    const carousel = target.closest('[data-carousel]') || 
                    target.closest('#carousel-container') ||
                    target.closest('.carousel');
    
    if (carousel) {
      // Determinar velocidad del swipe
      const velocity = Math.abs(distance) > 150 ? 'fast' : 'normal';
      
      // Disparar evento personalizado
      const swipeEvent = new CustomEvent('pixelSwipe', {
        detail: { direction, velocity, distance, carousel },
        bubbles: true
      });
      
      target.dispatchEvent(swipeEvent);
      
    }
  }

  /**
   * Configurar optimización de scroll
   */
  setupScrollOptimization() {
    let ticking = false;
    
    const optimizedScroll = () => {
      // Lazy loading trigger
      this.triggerLazyLoading();
      
      // Header hide/show en mobile
      if (this.config.isMobile) {
        this.handleMobileScroll();
      }
      
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(optimizedScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Manejar scroll en mobile
   */
  handleMobileScroll() {
    const scrollY = window.scrollY;
    const header = document.querySelector('header');
    
    if (header) {
      if (scrollY > 100) {
        header.classList.add('header-compact');
      } else {
        header.classList.remove('header-compact');
      }
    }
  }

  /**
   * Configurar optimizaciones iOS
   */
  setupiOSOptimizations() {
    // Prevenir bounce scroll
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.no-bounce')) {
        e.preventDefault();
      }
    }, { passive: false });

    // Optimizar viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover';
    }

    // Safe area support
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      document.body.style.paddingTop = 'env(safe-area-inset-top)';
      document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
    }
  }

  /**
   * ===== MANEJO DE ESTADOS =====
   */

  /**
   * Establecer estado de un componente
   */
  setState(componentId, state, data = {}) {
    const previousState = this.states.get(componentId);
    
    this.states.set(componentId, {
      state,
      data,
      timestamp: Date.now(),
      previous: previousState?.state
    });

    // Actualizar UI
    this.updateStateUI(componentId, state, data);
    
    // Logging para debug
  }

  /**
   * Obtener estado de componente
   */
  getState(componentId) {
    return this.states.get(componentId);
  }

  /**
   * Actualizar UI según estado
   */
  updateStateUI(componentId, state, data) {
    const element = document.querySelector(`[data-component="${componentId}"]`) ||
                   document.getElementById(componentId);
    
    if (!element) return;

    // Remover estados anteriores
    element.classList.remove('state-loading', 'state-success', 'state-error', 'state-idle');
    
    // Agregar nuevo estado
    element.classList.add(`state-${state}`);
    
    // Manejo específico por estado
    switch (state) {
      case 'loading':
        this.showLoadingState(element, data);
        break;
      case 'success':
        this.showSuccessState(element, data);
        break;
      case 'error':
        this.showErrorState(element, data);
        break;
      case 'idle':
        this.showIdleState(element, data);
        break;
    }
  }

  /**
   * Mostrar estado de carga
   */
  showLoadingState(element, data) {
    const { message = 'Cargando...', showSpinner = true, showSkeleton = false } = data;
    
    if (showSkeleton) {
      this.createSkeleton(element);
    } else if (showSpinner) {
      this.createSpinner(element, message);
    }
  }

  /**
   * Crear skeleton screen
   */
  createSkeleton(element) {
    const skeleton = document.createElement('div');
    skeleton.className = 'pixel-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-line-lg"></div>
        <div class="skeleton-line skeleton-line-md"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
      </div>
    `;
    
    element.appendChild(skeleton);
    
    // Auto-remover después de duración mínima
    setTimeout(() => {
      if (skeleton.parentNode) {
        skeleton.remove();
      }
    }, this.config.skeletonDuration);
  }

  /**
   * Crear spinner de carga
   */
  createSpinner(element, message) {
    const spinner = document.createElement('div');
    spinner.className = 'pixel-spinner';
    spinner.innerHTML = `
      <div class="spinner-content">
        <div class="spinner-icon">
          <div class="pixel-loader"></div>
        </div>
        <div class="spinner-message">${message}</div>
      </div>
    `;
    
    element.appendChild(spinner);
  }

  /**
   * Mostrar estado de éxito
   */
  showSuccessState(element, data) {
    const { message = '¡Éxito!', duration = 3000 } = data;
    
    this.showNotification('success', message, duration);
    
    // Remover indicadores de carga
    this.clearLoadingStates(element);
  }

  /**
   * Mostrar estado de error
   */
  showErrorState(element, data) {
    const { 
      message = 'Algo salió mal', 
      retry = true, 
      retryText = 'Reintentar',
      onRetry = null 
    } = data;
    
    this.clearLoadingStates(element);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'pixel-error';
    errorElement.innerHTML = `
      <div class="error-content">
        <div class="error-icon">❌</div>
        <div class="error-message">${message}</div>
        ${retry ? `<button class="error-retry btn btn-sm">${retryText}</button>` : ''}
      </div>
    `;
    
    if (retry && onRetry) {
      errorElement.querySelector('.error-retry').addEventListener('click', () => {
        errorElement.remove();
        onRetry();
      });
    }
    
    element.appendChild(errorElement);
    
    // Auto-retry si está configurado
    if (data.autoRetry && this.canRetry(element.id)) {
      setTimeout(() => {
        if (onRetry) onRetry();
      }, this.config.errorRetryDelay);
    }
  }

  /**
   * Limpiar estados de carga
   */
  clearLoadingStates(element) {
    element.querySelectorAll('.pixel-skeleton, .pixel-spinner').forEach(el => el.remove());
  }

  /**
   * Verificar si se puede reintentar
   */
  canRetry(componentId) {
    const state = this.states.get(componentId);
    if (!state) return true;
    
    const retryCount = state.data.retryCount || 0;
    return retryCount < this.config.maxRetries;
  }

  /**
   * ===== MANEJO DE ERRORES =====
   */

  /**
   * Manejar error global
   */
  handleGlobalError(type, error) {
    console.error(`🚨 Error global (${type}):`, error);
    
    this.performanceMetrics.errors.push({
      type,
      error: error.message || error.reason,
      timestamp: Date.now(),
      url: window.location.href
    });

    // Notificar al usuario solo si es crítico
    if (this.isCriticalError(error)) {
      this.showNotification('error', 'Se produjo un error inesperado. Recargando página...', 5000);
      
      // Auto-reload después de 5 segundos
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }

  /**
   * Determinar si un error es crítico
   */
  isCriticalError(error) {
    const criticalPatterns = [
      'script error',
      'network error',
      'chunk load error',
      'loading css chunk failed'
    ];
    
    const errorMessage = (error.message || error.reason || '').toLowerCase();
    return criticalPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Manejar cambio de red
   */
  handleNetworkChange(isOnline) {
    if (isOnline) {
      this.showNotification('success', 'Conexión restaurada', 2000);
      // Retry operaciones fallidas
      this.retryFailedOperations();
    } else {
      this.showNotification('warning', 'Sin conexión a internet', 0);
    }
  }

  /**
   * Reintentar operaciones fallidas
   */
  retryFailedOperations() {
    // Buscar elementos en estado de error
    document.querySelectorAll('.state-error').forEach(element => {
      const retryBtn = element.querySelector('.error-retry');
      if (retryBtn) {
        retryBtn.click();
      }
    });
  }

  /**
   * ===== UTILIDADES =====
   */

  /**
   * Mostrar notificación
   */
  showNotification(type, message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `pixel-notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-remove
    if (duration > 0) {
      setTimeout(() => this.removeNotification(notification), duration);
    }
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });
  }

  /**
   * Obtener icono de notificación
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Remover notificación
   */
  removeNotification(notification) {
    notification.classList.add('hide');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Pausar animaciones no críticas
   */
  pauseNonCriticalAnimations() {
    document.querySelectorAll('.pixel-hover, .animate-bounce').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }

  /**
   * Reanudar animaciones
   */
  resumeAnimations() {
    document.querySelectorAll('.pixel-hover, .animate-bounce').forEach(el => {
      el.style.animationPlayState = 'running';
    });
  }

  /**
   * Habilitar motion reducido
   */
  enableReducedMotion() {
    document.body.classList.add('reduce-motion');
    this.config.skeletonDuration = 200;
  }

  /**
   * Trigger lazy loading manual
   */
  triggerLazyLoading() {
    // Integración con PixelImageManager si existe
    if (window.PixelImageManager && window.PixelImageManager.processLoadQueue) {
      window.PixelImageManager.processLoadQueue();
    }
  }

  /**
   * Manejar cambio de viewport
   */
  handleViewportChange() {
    
    // Re-inicializar optimizaciones mobile
    if (this.config.isMobile) {
      this.initMobileOptimizations();
    }
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('pixelViewportChange', {
      detail: { isMobile: this.config.isMobile }
    }));
  }

  /**
   * Obtener métricas de performance
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      config: this.config,
      statesCount: this.states.size,
      timestamp: Date.now()
    };
  }

  /**
   * Destruir instancia
   */
  destroy() {
    this.states.clear();
    this.loadingElements.clear();
    this.errorHandlers.clear();
    this.isInitialized = false;
  }
}

// Crear instancia global
window.PixelStateManager = new PixelStateManager();

// Alias para facilidad de uso
window.PSM = window.PixelStateManager;

