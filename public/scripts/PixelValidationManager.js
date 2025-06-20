/**
 * PIXEL VALIDATION MANAGER - VERSIÓN ÚNICA Y DEFINITIVA
 * Sistema de validación en tiempo real para formularios de Pixel Living
 * 
 * IMPORTANTE: Este es el ÚNICO archivo de validación del proyecto.
 */

class PixelValidationManager {
  constructor() {
    // Evitar múltiples inicializaciones
    if (window.PIXEL_VALIDATION_INITIALIZED) {
      console.warn('⚠️ PixelValidationManager ya inicializado');
      return window.PIXEL_VALIDATION;
    }

    this.forms = new Map();
    this.debounceTimers = new Map();
    this.config = {
      debounceTime: 300,
      minNameLength: 2,
      maxNameLength: 50,
      minMessageLength: 10,
      maxMessageLength: 500,
      patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[0-9]{10}$/,
        name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
      },
      messages: {
        required: 'Este campo es obligatorio',
        email: 'Ingresa un correo electrónico válido (ej: juan@gmail.com)',
        phone: 'Ingresa un teléfono válido de 10 dígitos (ej: 3001234567)',
        name: 'Solo se permiten letras y espacios',
        minLength: 'Mínimo {min} caracteres',
        maxLength: 'Máximo {max} caracteres',
        date: 'La fecha no puede ser anterior a hoy',
        select: 'Selecciona una opción'
      }
    };
    
    this.validators = this.initValidators();
    this.init();
    
    // Marcar como inicializado
    window.PIXEL_VALIDATION_INITIALIZED = true;
  }

  init() {
    console.log('🚀 Inicializando PixelValidationManager ÚNICO...');
    this.setupFormObserver();
    this.initExistingForms();
    this.setupGlobalEvents();
  }

  // ... [resto del código del validation manager consolidado]
  // [Aquí va TODO el código del artifact anterior "PixelValidationManager.js - VERSIÓN FINAL CONSOLIDADA"]
}

// ===== INICIALIZACIÓN SEGURA =====
window.PixelValidationManager = PixelValidationManager;

// SOLO crear instancia si no existe
if (!window.PIXEL_VALIDATION) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.PIXEL_VALIDATION) {
        window.PIXEL_VALIDATION = new PixelValidationManager();
        console.log('✅ PIXEL_VALIDATION creado en DOMContentLoaded');
      }
    });
  } else {
    window.PIXEL_VALIDATION = new PixelValidationManager();
    console.log('✅ PIXEL_VALIDATION creado inmediatamente');
  }
}

console.log('✅ PixelValidationManager ÚNICO cargado');