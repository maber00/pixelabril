// public/scripts/pixel-init-system.js - VERSIÓN CORREGIDA
/**
 * PIXEL INITIALIZATION SYSTEM - VERSIÓN ROBUSTA
 * Sistema que maneja mejor los errores de carga y dependencias faltantes
 */

class PixelInitSystem {
  constructor() {
    this.managers = new Map();
    this.isInitialized = false;
    this.startTime = Date.now();
    this.loadingErrors = [];
    
    // Lista flexible de managers - algunos opcionales
    this.managerConfigs = [
      { name: 'PIXEL_CONFIG', required: true, global: 'PIXEL_CONFIG' },
      { name: 'PixelAccessibilityManager', required: false, global: 'PixelAccessibilityManager' },
      { name: 'PixelErrorManager', required: false, global: 'PixelErrorManager' },
      { name: 'PixelValidationManager', required: true, global: 'PixelValidationManager' },
      { name: 'PixelFormSender', required: true, global: 'PixelFormSender' }
    ];
    
    this.init();
  }

  async init() {
    
    try {
      await this.waitForCriticalDependencies();
      await this.initializeAvailableManagers();
      await this.setupBasicInterconnections();
      await this.runHealthCheck();
      
      this.isInitialized = true;
      this.announceSystemReady();
      
    } catch (error) {
      await this.fallbackInitialization();
    }
  }

  async waitForCriticalDependencies(timeout = 5000) {
    
    const criticalManagers = this.managerConfigs.filter(m => m.required);
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkDependencies = () => {
        const missing = criticalManagers.filter(config => !window[config.global]);
        
        if (missing.length === 0) {
          resolve();
          return;
        }
        
        // Si pasa el timeout, continuar de todas formas
        if (Date.now() - startTime > timeout) {
          this.loadingErrors.push(`Timeout: ${missing.map(m => m.name).join(', ')}`);
          resolve();
          return;
        }
        
        // Reintentár después de un delay más corto
        setTimeout(checkDependencies, 200);
      };
      
      checkDependencies();
    });
  }

  // ===== INICIALIZAR SOLO MANAGERS DISPONIBLES =====
  async initializeAvailableManagers() {
    
    for (const config of this.managerConfigs) {
      try {
        if (window[config.global]) {
          await this.initializeManager(config);
        } else {
          this.loadingErrors.push(`${config.name} no disponible`);
        }
        
        await this.sleep(10); // Micro-delay entre inicializaciones
      } catch (error) {
        this.loadingErrors.push(`${config.name}: ${error.message}`);
        
        if (config.required) {
          await this.attemptManagerFallback(config);
        }
      }
    }
  }

  async initializeManager(config) {
    switch (config.name) {
      case 'PIXEL_CONFIG':
        return this.initConfig();
      case 'PixelAccessibilityManager':
        return this.initAccessibility();
      case 'PixelErrorManager':
        return this.initErrorManager();
      case 'PixelValidationManager':
        return this.initValidation();
      case 'PixelFormSender':
        return this.initFormSender();
      default:
    }
  }

  async initConfig() {
    if (!window.PIXEL_CONFIG) {
      throw new Error('PIXEL_CONFIG no disponible');
    }
    
    if (!window.PIXEL_CONFIG.whatsapp) {
    }
    
    this.managers.set('config', window.PIXEL_CONFIG);
  }

  async initAccessibility() {
    if (!window.PixelAccessibilityManager) {
      return;
    }
    
    if (!window.PAM) {
      window.PAM = new window.PixelAccessibilityManager();
    }
    
    this.managers.set('accessibility', window.PAM);
  }

  async initErrorManager() {
    if (!window.PixelErrorManager) {
      return;
    }
    
    if (!window.PEM) {
      window.PEM = new window.PixelErrorManager();
    }
    
    this.managers.set('errorManager', window.PEM);
  }

  async initValidation() {
    if (!window.PixelValidationManager) {
      throw new Error('PixelValidationManager es requerido pero no está disponible');
    }
    
    if (!window.PVM) {
      window.PVM = new window.PixelValidationManager();
    }
    
    if (window.PIXEL_CONFIG?.validation) {
      try {
        window.PVM.updateConfig(window.PIXEL_CONFIG.validation);
      } catch (error) {
      }
    }
    
    this.managers.set('validation', window.PVM);
  }

  async initFormSender() {
    if (!window.PixelFormSender) {
      throw new Error('PixelFormSender es requerido pero no está disponible');
    }
    
    if (!window.PFS) {
      window.PFS = new window.PixelFormSender();
    }
    
    // Aplicar configuración si está disponible
    if (window.PIXEL_CONFIG) {
      try {
        window.PFS.updateConfig({
          whatsapp: window.PIXEL_CONFIG.whatsapp || { number: '573001234567', baseUrl: 'https://wa.me/' },
          formspree: window.PIXEL_CONFIG.formspree || { endpoints: {} },
          backup: { email: window.PIXEL_CONFIG.emails?.info || 'info@pixelliving.co' }
        });
      } catch (error) {
      }
    }
    
    this.managers.set('formSender', window.PFS);
  }

  async attemptManagerFallback(config) {
    
    switch (config.name) {
      case 'PixelValidationManager':
        // Crear validación básica
        this.createBasicValidation();
        break;
      case 'PixelFormSender':
        // Crear sender básico
        this.createBasicFormSender();
        break;
      default:
    }
  }

  createBasicValidation() {
    
    window.PVM = {
      getFormState: () => ({ isValid: false }),
      showFormError: (form, message) => {
        alert(message); // Fallback muy básico
      },
      showFormLoading: (form) => {
        const btn = form.querySelector('[type="submit"]');
        if (btn) btn.disabled = true;
      },
      showFormSuccess: (form, message) => {
        const btn = form.querySelector('[type="submit"]');
        if (btn) btn.disabled = false;
      }
    };
    
    this.managers.set('validation', window.PVM);
  }

  createBasicFormSender() {
    
    window.PFS = {
      updateConfig: (config) => {
      },
      getConfig: () => ({
        whatsapp: { number: '573001234567' },
        formspree: { endpoints: {} }
      })
    };
    
    this.managers.set('formSender', window.PFS);
  }

  // ===== CONEXIONES BÁSICAS =====
  async setupBasicInterconnections() {
    
    this.setupFormSubmissionFlow();
    this.setupBasicErrorHandling();
  }

  setupFormSubmissionFlow() {
    document.addEventListener('pixelFormValidated', (e) => {
      
      if (window.PAM && typeof window.PAM.announce === 'function') {
        try {
          window.PAM.announce('Enviando formulario...', 'polite');
        } catch (error) {
        }
      }
    });

    document.addEventListener('pixelFormError', (e) => {
    });

    document.addEventListener('pixelFormSuccess', (e) => {
    });
  }

  setupBasicErrorHandling() {
    window.addEventListener('error', (e) => {
      if (e.filename && e.filename.includes('pixel-')) {
      }
    });
  }

  async runHealthCheck() {
    
    const results = [];
    
    const availableManagers = Array.from(this.managers.keys());
    results.push({
      name: 'Managers disponibles',
      success: availableManagers.length > 0,
      result: `${availableManagers.length} managers: ${availableManagers.join(', ')}`
    });
    
    // Check de formularios
    const forms = document.querySelectorAll('form[data-form-type]');
    results.push({
      name: 'Formularios detectados',
      success: forms.length > 0,
      result: `${forms.length} formularios encontrados`
    });
    
    // Check de configuración básica
    const hasConfig = !!window.PIXEL_CONFIG;
    results.push({
      name: 'Configuración',
      success: hasConfig,
      result: hasConfig ? 'Configuración disponible' : 'Sin configuración'
    });

    this.healthCheckResults = results;
    
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
    } else {
    }
  }

  async fallbackInitialization() {
    
    try {
      if (!window.PVM && window.PixelValidationManager) {
        window.PVM = new window.PixelValidationManager();
        this.managers.set('validation', window.PVM);
      } else if (!window.PVM) {
        this.createBasicValidation();
      }
      
      // Intentar al menos tener form sender básico
      if (!window.PFS && window.PixelFormSender) {
        window.PFS = new window.PixelFormSender();
        this.managers.set('formSender', window.PFS);
      } else if (!window.PFS) {
        this.createBasicFormSender();
      }
      
      this.setupBasicInterconnections();
      
      this.isInitialized = true;
      
      this.announceSystemReady(true);
      
    } catch (error) {
      this.showCriticalErrorNotification();
    }
  }

  announceSystemReady(isFallback = false) {
    const initTime = Date.now() - this.startTime;
    const statusIcon = isFallback ? '⚠️' : '🎉';
    const statusText = isFallback ? 'con funcionalidad reducida' : 'exitosamente';
    
    
    if (this.loadingErrors.length > 0) {
    }
    
    document.dispatchEvent(new CustomEvent('pixelSystemReady', {
      detail: {
        initTime,
        managers: Array.from(this.managers.keys()),
        healthCheck: this.healthCheckResults,
        errors: this.loadingErrors,
        isFallback
      }
    }));

    // Anuncio accesible si está disponible
    if (window.PAM && typeof window.PAM.announcePageLoad === 'function') {
      try {
        window.PAM.announcePageLoad(document.title);
      } catch (error) {
      }
    }

    // Info de debug
    if (window.PIXEL_CONFIG?.debug?.enableLogging) {
      this.logSystemStatus(isFallback);
    }
  }

  logSystemStatus(isFallback) {
   
    
    if (isFallback) {
    }
    
    if (this.loadingErrors.length > 0) {
    }
    
    
  }

  showCriticalErrorNotification() {
    // Solo mostrar si es realmente crítico
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fef3c7;
      color: #92400e;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #f59e0b;
      z-index: 9999;
      max-width: 400px;
      font-family: system-ui, sans-serif;
    `;
    
    notification.innerHTML = `
      <strong>⚠️ Sistema cargado con funcionalidad reducida</strong><br>
      Los formularios funcionarán, pero con características limitadas.<br>
      <small>Revisa la consola del navegador para más detalles.</small>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 8 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  // ===== UTILIDADES =====
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== API PÚBLICA =====
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      initTime: Date.now() - this.startTime,
      managers: Array.from(this.managers.keys()),
      healthCheck: this.healthCheckResults || null,
      errors: this.loadingErrors,
      hasErrors: this.loadingErrors.length > 0
    };
  }

  getManager(name) {
    return this.managers.get(name);
  }

  getLoadingErrors() {
    return [...this.loadingErrors];
  }

  async reinitialize() {
    this.isInitialized = false;
    this.managers.clear();
    this.loadingErrors = [];
    this.startTime = Date.now();
    await this.init();
  }

  async runDiagnostics() {
    
    try {
      
      // Verificar scripts disponibles
      const scripts = [
        { name: 'PIXEL_CONFIG', available: !!window.PIXEL_CONFIG },
        { name: 'PixelAccessibilityManager', available: !!window.PixelAccessibilityManager },
        { name: 'PixelErrorManager', available: !!window.PixelErrorManager },
        { name: 'PixelValidationManager', available: !!window.PixelValidationManager },
        { name: 'PixelFormSender', available: !!window.PixelFormSender }
      ];
      
      scripts.forEach(script => {
      });
      
      // Verificar instancias
      const instances = [
        { name: 'PAM', available: !!window.PAM },
        { name: 'PEM', available: !!window.PEM },
        { name: 'PVM', available: !!window.PVM },
        { name: 'PFS', available: !!window.PFS }
      ];
      
      instances.forEach(instance => {
      });
      
      const forms = document.querySelectorAll('form[data-form-type]');
      
      if (this.loadingErrors.length > 0) {
      }
      
      return true;
      
    } catch (error) {
      return false;
    } finally {
    }
  }
}

window.PixelInitSystem = PixelInitSystem;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PIXEL_SYSTEM = new PixelInitSystem();
  });
} else {
  window.PIXEL_SYSTEM = new PixelInitSystem();
}

