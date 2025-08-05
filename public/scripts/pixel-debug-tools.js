// public/scripts/pixel-debug-tools.js
/**
 * PIXEL DEBUG TOOLS
 * Herramientas de debugging y testing para desarrollo
 * Solo se carga en modo debug
 */

class PixelDebugTools {
  constructor() {
    // Solo cargar en modo debug
    if (!window.PIXEL_CONFIG?.debug?.enableLogging) {
      return;
    }

    this.testResults = [];
    this.isDebugMode = true;
    this.debugUI = null;
    
    this.init();
  }

  init() {
    
    this.setupDebugUI();
    this.setupKeyboardShortcuts();
    this.setupConsoleHelpers();
    this.attachToSystemEvents();
    
  }

  // ===== DEBUG UI =====
  setupDebugUI() {
    // Crear panel de debug flotante
    this.debugUI = document.createElement('div');
    this.debugUI.id = 'pixel-debug-panel';
    this.debugUI.className = 'pixel-debug-panel hidden';
    this.debugUI.innerHTML = this.getDebugUIHTML();
    
    document.body.appendChild(this.debugUI);
    
    // Setup eventos del panel
    this.setupDebugUIEvents();
  }

  getDebugUIHTML() {
    return `
      <div class="debug-header">
        <h3>🐛 Pixel Debug Tools</h3>
        <button class="debug-close">×</button>
      </div>
      
      <div class="debug-tabs">
        <button class="debug-tab active" data-tab="system">Sistema</button>
        <button class="debug-tab" data-tab="forms">Formularios</button>
        <button class="debug-tab" data-tab="tests">Tests</button>
        <button class="debug-tab" data-tab="logs">Logs</button>
      </div>
      
      <div class="debug-content">
        <!-- Tab Sistema -->
        <div class="debug-tab-content active" data-tab="system">
          <h4>Estado del Sistema</h4>
          <div id="system-status"></div>
          
          <h4>Configuración</h4>
          <div id="config-status"></div>
          
          <button class="debug-btn" onclick="window.debugTools.runSystemDiagnostic()">
            🔍 Ejecutar Diagnóstico
          </button>
          
          <button class="debug-btn" onclick="window.debugTools.reinitializeSystem()">
            🔄 Reinicializar Sistema
          </button>
        </div>
        
        <!-- Tab Formularios -->
        <div class="debug-tab-content" data-tab="forms">
          <h4>Formularios Detectados</h4>
          <div id="forms-list"></div>
          
          <h4>Herramientas de Formulario</h4>
          <button class="debug-btn" onclick="window.debugTools.testFormValidation()">
            ✅ Test Validación
          </button>
          
          <button class="debug-btn" onclick="window.debugTools.testFormSubmission()">
            📤 Test Envío
          </button>
          
          <button class="debug-btn" onclick="window.debugTools.simulateFormError()">
            ❌ Simular Error
          </button>
        </div>
        
        <!-- Tab Tests -->
        <div class="debug-tab-content" data-tab="tests">
          <h4>Suite de Tests</h4>
          <div id="tests-results"></div>
          
          <button class="debug-btn" onclick="window.debugTools.runAllTests()">
            🧪 Ejecutar Todos los Tests
          </button>
          
          <button class="debug-btn" onclick="window.debugTools.runFormTests()">
            📋 Tests de Formularios
          </button>
          
          <button class="debug-btn" onclick="window.debugTools.runAccessibilityTests()">
            ♿ Tests de Accesibilidad
          </button>
        </div>
        
        <!-- Tab Logs -->
        <div class="debug-tab-content" data-tab="logs">
          <h4>Logs del Sistema</h4>
          <button class="debug-btn" onclick="window.debugTools.clearLogs()">
            🗑️ Limpiar Logs
          </button>
          <div id="logs-container"></div>
        </div>
      </div>
    `;
  }

  setupDebugUIEvents() {
    // Cerrar panel
    this.debugUI.querySelector('.debug-close').addEventListener('click', () => {
      this.hideDebugPanel();
    });

    // Cambiar tabs
    this.debugUI.querySelectorAll('.debug-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchDebugTab(e.target.dataset.tab);
      });
    });

    // Actualizar contenido automáticamente
    setInterval(() => {
      this.updateDebugContent();
    }, 2000);
  }

  switchDebugTab(tabName) {
    // Activar tab
    this.debugUI.querySelectorAll('.debug-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Mostrar contenido
    this.debugUI.querySelectorAll('.debug-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });

    // Actualizar contenido específico
    this.updateDebugContent(tabName);
  }

  updateDebugContent(specificTab = null) {
    if (!specificTab || specificTab === 'system') {
      this.updateSystemStatus();
    }
    
    if (!specificTab || specificTab === 'forms') {
      this.updateFormsStatus();
    }
    
    if (!specificTab || specificTab === 'logs') {
      this.updateLogsDisplay();
    }
  }

  updateSystemStatus() {
    const systemStatus = this.debugUI.querySelector('#system-status');
    const configStatus = this.debugUI.querySelector('#config-status');
    
    if (systemStatus) {
      const status = window.PIXEL_SYSTEM?.getSystemStatus?.() || {};
      systemStatus.innerHTML = `
        <div class="status-item ${status.isInitialized ? 'success' : 'error'}">
          Sistema Inicializado: ${status.isInitialized ? '✅' : '❌'}
        </div>
        <div class="status-item">
          Tiempo de init: ${status.initTime || 0}ms
        </div>
        <div class="status-item">
          Managers: ${status.managers?.length || 0}
        </div>
      `;
    }

    if (configStatus) {
      const config = window.PIXEL_CONFIG || {};
      const hasWhatsApp = !!config.whatsapp?.number && !config.whatsapp.number.includes('5730012');
      const hasFormspree = !!config.formspree?.endpoints && !Object.values(config.formspree.endpoints)[0]?.includes('YOUR_');
      
      configStatus.innerHTML = `
        <div class="status-item ${hasWhatsApp ? 'success' : 'warning'}">
          WhatsApp: ${hasWhatsApp ? '✅ Configurado' : '⚠️ Usar valor por defecto'}
        </div>
        <div class="status-item ${hasFormspree ? 'success' : 'warning'}">
          Formspree: ${hasFormspree ? '✅ Configurado' : '⚠️ Usar valor por defecto'}
        </div>
        <div class="status-item">
          Debug: ${config.debug?.enableLogging ? '✅ Activo' : '❌ Inactivo'}
        </div>
      `;
    }
  }

  updateFormsStatus() {
    const formsList = this.debugUI.querySelector('#forms-list');
    
    if (formsList) {
      const forms = document.querySelectorAll('form[data-form-type]');
      
      if (forms.length === 0) {
        formsList.innerHTML = '<div class="status-item warning">⚠️ No se encontraron formularios</div>';
        return;
      }

      formsList.innerHTML = Array.from(forms).map((form, index) => {
        const formType = form.getAttribute('data-form-type');
        const formId = form.id || `form-${index}`;
        const isValid = window.PVM?.getFormState?.(formId)?.isValid || false;
        
        return `
          <div class="form-item">
            <strong>${formId}</strong> (${formType})
            <span class="status ${isValid ? 'success' : 'neutral'}">${isValid ? '✅' : '⏳'}</span>
            <button class="debug-btn-small" onclick="window.debugTools.focusForm('${formId}')">
              🎯 Focus
            </button>
          </div>
        `;
      }).join('');
    }
  }

  updateLogsDisplay() {
    const logsContainer = this.debugUI.querySelector('#logs-container');
    
    if (logsContainer && window.pixelLogs) {
      const recentLogs = window.pixelLogs.slice(-20);
      
      logsContainer.innerHTML = recentLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const typeClass = log.type === 'error' ? 'error' : log.type === 'warn' ? 'warning' : 'info';
        
        return `
          <div class="log-item ${typeClass}">
            <span class="log-time">${time}</span>
            <span class="log-type">${log.type.toUpperCase()}</span>
            <span class="log-message">${log.args.join(' ')}</span>
          </div>
        `;
      }).join('');
      
      // Scroll to bottom
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  // ===== KEYBOARD SHORTCUTS =====
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+D - Toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.toggleDebugPanel();
      }
      
      // Ctrl+Shift+T - Run tests
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.runAllTests();
      }
      
      // Ctrl+Shift+R - Reinitialize
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        this.reinitializeSystem();
      }
    });
  }

  toggleDebugPanel() {
    if (this.debugUI.classList.contains('hidden')) {
      this.showDebugPanel();
    } else {
      this.hideDebugPanel();
    }
  }

  showDebugPanel() {
    this.debugUI.classList.remove('hidden');
    this.updateDebugContent();
  }

  hideDebugPanel() {
    this.debugUI.classList.add('hidden');
  }

  setupConsoleHelpers() {
    window.debugTools = this;
    
    window.testForms = () => this.runFormTests();
    window.testValidation = () => this.testFormValidation();
    window.systemStatus = () => console.table(window.PIXEL_SYSTEM?.getSystemStatus?.());
    window.pixelConfig = () => console.log(window.PIXEL_CONFIG);
    
  }

  // ===== EVENT MONITORING =====
  attachToSystemEvents() {
    // Monitorear eventos del sistema
    const eventsToMonitor = [
      'pixelFormValidated',
      'pixelFormError', 
      'pixelFormSuccess',
      'pixelSystemReady',
      'estudioSeleccionado'
    ];

    eventsToMonitor.forEach(eventName => {
      document.addEventListener(eventName, (e) => {
      });
    });
  }

  // ===== TESTING FUNCTIONS =====
  async runAllTests() {
    
    this.testResults = [];
    
    const tests = [
      { name: 'Sistema Inicializado', test: () => this.testSystemInitialization() },
      { name: 'Configuración Válida', test: () => this.testConfiguration() },
      { name: 'Managers Disponibles', test: () => this.testManagers() },
      { name: 'Formularios Detectados', test: () => this.testFormsDetection() },
      { name: 'Validación Funcional', test: () => this.testValidationSystem() },
      { name: 'Accesibilidad Básica', test: () => this.testAccessibility() }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({ name: test.name, success: true, result });
      } catch (error) {
        this.testResults.push({ name: test.name, success: false, error: error.message });
      }
    }

    const passedTests = this.testResults.filter(r => r.success).length;
    const totalTests = this.testResults.length;
    
    
    
    this.displayTestResults();
    
    return { passed: passedTests, total: totalTests, results: this.testResults };
  }

  async runFormTests() {
    
    await this.testFormsDetection();
    await this.testValidationSystem();
    await this.testFormSubmission();
    
  }

  async runAccessibilityTests() {
    
    await this.testAccessibility();
    await this.testKeyboardNavigation();
    await this.testScreenReaderSupport();
    
  }

  testSystemInitialization() {
    if (!window.PIXEL_SYSTEM) throw new Error('PIXEL_SYSTEM no disponible');
    if (!window.PIXEL_SYSTEM.isInitialized) throw new Error('Sistema no inicializado');
    return 'Sistema inicializado correctamente';
  }

  testConfiguration() {
    if (!window.PIXEL_CONFIG) throw new Error('PIXEL_CONFIG no disponible');
    if (!window.PIXEL_CONFIG.whatsapp?.number) throw new Error('WhatsApp no configurado');
    return 'Configuración básica OK';
  }

  testManagers() {
    const requiredManagers = ['PAM', 'PEM', 'PVM', 'PFS'];
    const missing = requiredManagers.filter(name => !window[name]);
    if (missing.length > 0) throw new Error(`Managers faltantes: ${missing.join(', ')}`);
    return `${requiredManagers.length} managers disponibles`;
  }

  testFormsDetection() {
    const forms = document.querySelectorAll('form[data-form-type]');
    if (forms.length === 0) throw new Error('No se encontraron formularios');
    return `${forms.length} formularios detectados`;
  }

  testValidationSystem() {
    if (!window.PVM) throw new Error('Sistema de validación no disponible');
    
    // Test básico de validación
    const testForm = document.querySelector('form[data-form-type]');
    if (!testForm) throw new Error('No hay formularios para probar');
    
    return 'Sistema de validación disponible';
  }

  testAccessibility() {
    if (!window.PAM) throw new Error('Sistema de accesibilidad no disponible');
    
    // Verificar live regions
    const liveRegions = document.querySelectorAll('.pixel-live-region');
    if (liveRegions.length === 0) throw new Error('Live regions no encontradas');
    
    return `Accesibilidad OK - ${liveRegions.length} live regions`;
  }

  testKeyboardNavigation() {
    // Simular navegación por teclado
    const focusableElements = document.querySelectorAll('button, input, a, [tabindex]');
    if (focusableElements.length === 0) throw new Error('No hay elementos enfocables');
    
    return `${focusableElements.length} elementos enfocables encontrados`;
  }

  testScreenReaderSupport() {
    // Verificar atributos ARIA
    const ariaElements = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
    if (ariaElements.length === 0) throw new Error('Pocos elementos con ARIA');
    
    return `${ariaElements.length} elementos con atributos ARIA`;
  }

  // ===== SIMULATION FUNCTIONS =====
  async testFormValidation() {
    
    const form = document.querySelector('form[data-form-type]');
    if (!form) {
      return;
    }

    // Simular errores de validación
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach((input, index) => {
      setTimeout(() => {
        // Trigger eventos de validación
        input.focus();
        input.value = index % 2 === 0 ? '' : 'test@example.com'; // Alternar válido/inválido
        input.blur();
      }, index * 500);
    });

  }

  async testFormSubmission() {
    
    const form = document.querySelector('form[data-form-type]');
    if (!form) {
      return;
    }

    this.fillFormWithTestData(form);
    
    setTimeout(() => {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      }
    }, 1000);
  }

  simulateFormError() {
    
    const form = document.querySelector('form[data-form-type]');
    if (!form && window.PEM) {
      const error = new Error('NETWORK_ERROR');
      error.retryable = true;
      window.PEM.handleFormError(form, error);
    }
  }

  fillFormWithTestData(form) {
    const testData = {
      nombre: 'Usuario de Prueba',
      email: 'test@pixelliving.co',
      telefono: '3001234567',
      asunto: 'Test de formulario',
      mensaje: 'Este es un mensaje de prueba para validar el funcionamiento del sistema.',
      expectativas: 'Testing del sistema de formularios de Pixel Living'
    };

    Object.entries(testData).forEach(([name, value]) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (field) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

  }

  // ===== UTILITY FUNCTIONS =====
  focusForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = form.querySelector('input, textarea');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  runSystemDiagnostic() {
    if (window.PIXEL_SYSTEM?.runDiagnostics) {
      window.PIXEL_SYSTEM.runDiagnostics();
    } else {
      console.warn('Diagnóstico del sistema no disponible');
    }
  }

  async reinitializeSystem() {
    
    if (window.PIXEL_SYSTEM?.reinitialize) {
      await window.PIXEL_SYSTEM.reinitialize();
    } else {
      console.warn('Reinicialización no disponible');
    }
  }

  clearLogs() {
    if (window.pixelLogs) {
      window.pixelLogs = [];
    }
  }

  displayTestResults() {
    const testsContainer = this.debugUI?.querySelector('#tests-results');
    if (!testsContainer) return;

    testsContainer.innerHTML = this.testResults.map(result => `
      <div class="test-result ${result.success ? 'success' : 'error'}">
        <span class="test-name">${result.name}</span>
        <span class="test-status">${result.success ? '✅' : '❌'}</span>
        <div class="test-details">
          ${result.success ? result.result : result.error}
        </div>
      </div>
    `).join('');
  }

  // ===== CLEANUP =====
  destroy() {
    if (this.debugUI?.parentNode) {
      this.debugUI.parentNode.removeChild(this.debugUI);
    }
    
    delete window.debugTools;
    delete window.testForms;
    delete window.testValidation;
    delete window.systemStatus;
    delete window.pixelConfig;
  }
}

// ===== CSS PARA DEBUG UI =====
const debugStyles = `
  .pixel-debug-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .pixel-debug-panel.hidden { display: none !important; }
  
  .debug-header {
    background: #333;
    color: white;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .debug-header h3 { margin: 0; font-size: 16px; }
  
  .debug-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
  }
  
  .debug-tabs {
    display: flex;
    background: #f5f5f5;
    border-bottom: 1px solid #ccc;
  }
  
  .debug-tab {
    flex: 1;
    padding: 8px 4px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
  }
  
  .debug-tab.active {
    background: white;
    border-bottom: 2px solid #007cba;
  }
  
  .debug-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }
  
  .debug-tab-content { display: none; }
  .debug-tab-content.active { display: block; }
  
  .debug-tab-content h4 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 14px;
  }
  
  .debug-btn {
    background: #007cba;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin: 4px 4px 4px 0;
    font-size: 12px;
  }
  
  .debug-btn:hover { background: #005a87; }
  
  .debug-btn-small {
    background: #666;
    color: white;
    border: none;
    padding: 2px 6px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 10px;
    margin-left: 8px;
  }
  
  .status-item, .form-item, .test-result, .log-item {
    padding: 6px;
    margin: 4px 0;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .status-item.success, .test-result.success { background: #d4edda; color: #155724; }
  .status-item.error, .test-result.error { background: #f8d7da; color: #721c24; }
  .status-item.warning { background: #fff3cd; color: #856404; }
  .status-item.neutral { background: #e2e3e5; color: #383d41; }
  
  .form-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
  }
  
  .log-item {
    font-family: monospace;
    border-left: 3px solid #007cba;
    background: #f8f9fa;
  }
  
  .log-item.error { border-color: #dc3545; }
  .log-item.warning { border-color: #ffc107; }
  
  .log-time { color: #666; margin-right: 8px; }
  .log-type { font-weight: bold; margin-right: 8px; }
  
  #logs-container {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px;
  }
`;

// Inyectar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = debugStyles;
document.head.appendChild(styleSheet);

// ===== INICIALIZACIÓN =====
window.PixelDebugTools = PixelDebugTools;

// Solo inicializar en modo debug
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.PIXEL_CONFIG?.debug?.enableLogging) {
      window.DEBUG_TOOLS = new PixelDebugTools();
    }
  });
} else {
  if (window.PIXEL_CONFIG?.debug?.enableLogging) {
    window.DEBUG_TOOLS = new PixelDebugTools();
  }
}

console.log('✅ PixelDebugTools cargado');