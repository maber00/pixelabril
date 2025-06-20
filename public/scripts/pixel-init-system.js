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
    console.log('🚀 Iniciando Pixel Living System (Versión Robusta)...');
    
    try {
      await this.waitForCriticalDependencies();
      await this.initializeAvailableManagers();
      await this.setupBasicInterconnections();
      await this.runHealthCheck();
      
      this.isInitialized = true;
      this.announceSystemReady();
      
    } catch (error) {
      console.warn('⚠️ Inicialización con errores:', error.message);
      await this.fallbackInitialization();
    }
  }

  // ===== ESPERAR SOLO DEPENDENCIAS CRÍTICAS =====
  async waitForCriticalDependencies(timeout = 5000) {
    console.log('⏳ Esperando dependencias críticas...');
    
    const criticalManagers = this.managerConfigs.filter(m => m.required);
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkDependencies = () => {
        const missing = criticalManagers.filter(config => !window[config.global]);
        
        if (missing.length === 0) {
          console.log('✅ Dependencias críticas cargadas');
          resolve();
          return;
        }
        
        // Si pasa el timeout, continuar de todas formas
        if (Date.now() - startTime > timeout) {
          console.warn(`⏰ Timeout alcanzado. Continuando sin: ${missing.map(m => m.name).join(', ')}`);
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
    console.log('🔧 Inicializando managers disponibles...');
    
    for (const config of this.managerConfigs) {
      try {
        if (window[config.global]) {
          console.log(`  🔹 Inicializando ${config.name}...`);
          await this.initializeManager(config);
          console.log(`  ✅ ${config.name} inicializado`);
        } else {
          console.warn(`  ⚠️ ${config.name} no disponible - ${config.required ? 'REQUERIDO' : 'opcional'}`);
          this.loadingErrors.push(`${config.name} no disponible`);
        }
        
        await this.sleep(10); // Micro-delay entre inicializaciones
      } catch (error) {
        console.error(`  ❌ Error inicializando ${config.name}:`, error.message);
        this.loadingErrors.push(`${config.name}: ${error.message}`);
        
        // Si es requerido, intentar fallback
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
        console.warn(`Manager no reconocido: ${config.name}`);
    }
  }

  async initConfig() {
    if (!window.PIXEL_CONFIG) {
      throw new Error('PIXEL_CONFIG no disponible');
    }
    
    // Validación básica
    if (!window.PIXEL_CONFIG.whatsapp) {
      console.warn('⚠️ Configuración de WhatsApp faltante');
    }
    
    this.managers.set('config', window.PIXEL_CONFIG);
  }

  async initAccessibility() {
    if (!window.PixelAccessibilityManager) {
      console.warn('⚠️ PixelAccessibilityManager no disponible - funcionalidad de accesibilidad limitada');
      return;
    }
    
    if (!window.PAM) {
      window.PAM = new window.PixelAccessibilityManager();
    }
    
    this.managers.set('accessibility', window.PAM);
  }

  async initErrorManager() {
    if (!window.PixelErrorManager) {
      console.warn('⚠️ PixelErrorManager no disponible - manejo de errores básico');
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
    
    // Aplicar configuración si está disponible
    if (window.PIXEL_CONFIG?.validation) {
      try {
        window.PVM.updateConfig(window.PIXEL_CONFIG.validation);
      } catch (error) {
        console.warn('Error aplicando configuración de validación:', error);
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
        console.warn('Error aplicando configuración de FormSender:', error);
      }
    }
    
    this.managers.set('formSender', window.PFS);
  }

  async attemptManagerFallback(config) {
    console.log(`🔄 Intentando fallback para ${config.name}...`);
    
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
        console.warn(`Sin fallback disponible para ${config.name}`);
    }
  }

  createBasicValidation() {
    console.log('🔧 Creando sistema de validación básico...');
    
    window.PVM = {
      getFormState: () => ({ isValid: false }),
      showFormError: (form, message) => {
        console.error('Error de formulario:', message);
        alert(message); // Fallback muy básico
      },
      showFormLoading: (form) => {
        const btn = form.querySelector('[type="submit"]');
        if (btn) btn.disabled = true;
      },
      showFormSuccess: (form, message) => {
        console.log('Formulario exitoso:', message);
        const btn = form.querySelector('[type="submit"]');
        if (btn) btn.disabled = false;
      }
    };
    
    this.managers.set('validation', window.PVM);
  }

  createBasicFormSender() {
    console.log('🔧 Creando sistema de envío básico...');
    
    window.PFS = {
      updateConfig: (config) => {
        console.log('Configuración actualizada:', config);
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
    console.log('🔗 Configurando interconexiones básicas...');
    
    // Solo configurar eventos que sabemos que funcionarán
    this.setupFormSubmissionFlow();
    this.setupBasicErrorHandling();
  }

  setupFormSubmissionFlow() {
    // Flujo básico de formularios
    document.addEventListener('pixelFormValidated', (e) => {
      console.log('📤 Formulario validado:', e.detail);
      
      // Anuncio básico si PAM está disponible
      if (window.PAM && typeof window.PAM.announce === 'function') {
        try {
          window.PAM.announce('Enviando formulario...', 'polite');
        } catch (error) {
          console.warn('Error en anuncio PAM:', error);
        }
      }
    });

    document.addEventListener('pixelFormError', (e) => {
      console.error('❌ Error en formulario:', e.detail);
    });

    document.addEventListener('pixelFormSuccess', (e) => {
      console.log('✅ Formulario enviado:', e.detail);
    });
  }

  setupBasicErrorHandling() {
    // Manejo básico de errores
    window.addEventListener('error', (e) => {
      if (e.filename && e.filename.includes('pixel-')) {
        console.error('🚨 Error en sistema Pixel:', e.error);
      }
    });
  }

  // ===== HEALTH CHECK SIMPLIFICADO =====
  async runHealthCheck() {
    console.log('🏥 Ejecutando health check simplificado...');
    
    const results = [];
    
    // Check básico de managers
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
      console.warn(`⚠️ ${failed.length} checks fallaron, pero el sistema funcionará con funcionalidad reducida`);
    } else {
      console.log('✅ Health check completado satisfactoriamente');
    }
  }

  // ===== INICIALIZACIÓN DE FALLBACK =====
  async fallbackInitialization() {
    console.log('🔧 Ejecutando inicialización de fallback...');
    
    try {
      // Intentar al menos tener validación básica
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
      
      // Configurar al menos interconexiones básicas
      this.setupBasicInterconnections();
      
      this.isInitialized = true;
      console.log('✅ Inicialización de fallback completada');
      
      this.announceSystemReady(true);
      
    } catch (error) {
      console.error('❌ Fallback también falló:', error);
      this.showCriticalErrorNotification();
    }
  }

  // ===== ANUNCIAR SISTEMA LISTO =====
  announceSystemReady(isFallback = false) {
    const initTime = Date.now() - this.startTime;
    const statusIcon = isFallback ? '⚠️' : '🎉';
    const statusText = isFallback ? 'con funcionalidad reducida' : 'exitosamente';
    
    console.log(`${statusIcon} Pixel Living System iniciado ${statusText} en ${initTime}ms`);
    
    if (this.loadingErrors.length > 0) {
      console.warn('📋 Errores durante la carga:', this.loadingErrors);
    }
    
    // Crear evento global
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
        console.warn('Error en anuncio de página:', error);
      }
    }

    // Info de debug
    if (window.PIXEL_CONFIG?.debug?.enableLogging) {
      this.logSystemStatus(isFallback);
    }
  }

  logSystemStatus(isFallback) {
    console.group('📊 Estado del Sistema Pixel Living');
    console.log('⏱️ Tiempo de inicialización:', Date.now() - this.startTime, 'ms');
    console.log('🔧 Managers activos:', Array.from(this.managers.keys()));
    console.log('🏥 Health check:', this.healthCheckResults);
    
    if (isFallback) {
      console.warn('⚠️ Sistema en modo fallback');
    }
    
    if (this.loadingErrors.length > 0) {
      console.warn('❌ Errores de carga:', this.loadingErrors);
    }
    
    console.log('📋 Configuración detectada:', {
      config: !!window.PIXEL_CONFIG,
      whatsapp: !!window.PIXEL_CONFIG?.whatsapp?.number,
      formspree: !!window.PIXEL_CONFIG?.formspree?.endpoints,
      debug: window.PIXEL_CONFIG?.debug?.enableLogging
    });
    console.groupEnd();
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
    console.log('🔄 Reinicializando sistema...');
    this.isInitialized = false;
    this.managers.clear();
    this.loadingErrors = [];
    this.startTime = Date.now();
    await this.init();
  }

  async runDiagnostics() {
    console.group('🔍 Diagnóstico del Sistema');
    
    try {
      console.log('📊 Estado actual:', this.getSystemStatus());
      
      // Verificar scripts disponibles
      const scripts = [
        { name: 'PIXEL_CONFIG', available: !!window.PIXEL_CONFIG },
        { name: 'PixelAccessibilityManager', available: !!window.PixelAccessibilityManager },
        { name: 'PixelErrorManager', available: !!window.PixelErrorManager },
        { name: 'PixelValidationManager', available: !!window.PixelValidationManager },
        { name: 'PixelFormSender', available: !!window.PixelFormSender }
      ];
      
      console.log('📜 Scripts disponibles:');
      scripts.forEach(script => {
        console.log(`  ${script.available ? '✅' : '❌'} ${script.name}`);
      });
      
      // Verificar instancias
      const instances = [
        { name: 'PAM', available: !!window.PAM },
        { name: 'PEM', available: !!window.PEM },
        { name: 'PVM', available: !!window.PVM },
        { name: 'PFS', available: !!window.PFS }
      ];
      
      console.log('🎛️ Instancias disponibles:');
      instances.forEach(instance => {
        console.log(`  ${instance.available ? '✅' : '❌'} ${instance.name}`);
      });
      
      // Test de formularios
      const forms = document.querySelectorAll('form[data-form-type]');
      console.log(`📋 Formularios: ${forms.length} encontrados`);
      
      if (this.loadingErrors.length > 0) {
        console.warn('❌ Errores registrados:', this.loadingErrors);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      return false;
    } finally {
      console.groupEnd();
    }
  }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
window.PixelInitSystem = PixelInitSystem;

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PIXEL_SYSTEM = new PixelInitSystem();
  });
} else {
  window.PIXEL_SYSTEM = new PixelInitSystem();
}

console.log('✅ PixelInitSystem (Versión Robusta) cargado');