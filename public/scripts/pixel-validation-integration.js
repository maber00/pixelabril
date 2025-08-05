// public/scripts/pixel-validation-manager.js
/**
 * PIXEL VALIDATION MANAGER
 * Sistema de validación en tiempo real para formularios de Pixel Living
 * Conecta el CSS de pixel-validation.css con funcionalidad JavaScript
 */

class PixelValidationManager {
  constructor() {
    this.forms = new Map();
    this.debounceTimers = new Map();
    this.validators = this.initValidators();
    this.init();
  }

  init() {
    this.setupFormObserver();
    this.initExistingForms();
    this.setupGlobalEvents();
  }

  // ===== CONFIGURACIÓN DE VALIDADORES =====
  initValidators() {
    return {
      required: (value) => ({
        isValid: value.trim().length > 0,
        message: 'Este campo es obligatorio'
      }),
      
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: emailRegex.test(value),
          message: 'Ingresa un correo electrónico válido (ej: juan@gmail.com)'
        };
      },
      
      phone: (value) => {
        // Validación para teléfonos colombianos
        const phoneRegex = /^[0-9]{10}$/;
        const cleanPhone = value.replace(/\D/g, '');
        return {
          isValid: phoneRegex.test(cleanPhone),
          message: 'Ingresa un teléfono válido de 10 dígitos (ej: 3001234567)'
        };
      },
      
      minLength: (value, min = 2) => ({
        isValid: value.trim().length >= min,
        message: `Mínimo ${min} caracteres`
      }),
      
      maxLength: (value, max = 500) => ({
        isValid: value.length <= max,
        message: `Máximo ${max} caracteres`
      }),
      
      date: (value) => {
        if (!value) return { isValid: false, message: 'Selecciona una fecha' };
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return {
          isValid: selectedDate >= today,
          message: 'La fecha no puede ser anterior a hoy'
        };
      },
      
      select: (value) => ({
        isValid: value && value !== '',
        message: 'Selecciona una opción'
      })
    };
  }

  // ===== OBSERVADOR DE FORMULARIOS =====
  setupFormObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.tagName === 'FORM') {
            this.initForm(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  initExistingForms() {
    document.querySelectorAll('form[data-form-type]').forEach(form => {
      this.initForm(form);
    });
  }

  // ===== INICIALIZACIÓN DE FORMULARIO INDIVIDUAL =====
  initForm(form) {
    const formId = form.id || `form-${Date.now()}`;
    if (this.forms.has(formId)) return;


    const formConfig = {
      element: form,
      fields: new Map(),
      type: form.getAttribute('data-form-type'),
      isValid: false
    };

    // Inicializar campos
    this.initFormFields(formConfig);
    
    // Setup eventos del formulario
    this.setupFormEvents(formConfig);
    
    this.forms.set(formId, formConfig);
  }

  initFormFields(formConfig) {
    const fields = formConfig.element.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      const fieldConfig = this.createFieldConfig(field);
      formConfig.fields.set(field.id || field.name, fieldConfig);
      
      // Crear contenedor de validación si no existe
      this.createValidationContainer(field);
      
      // Setup eventos del campo
      this.setupFieldEvents(field, fieldConfig, formConfig);
    });
  }

  createFieldConfig(field) {
    const config = {
      element: field,
      rules: this.getFieldRules(field),
      isValid: false,
      isDirty: false,
      lastValue: field.value
    };

    return config;
  }

  getFieldRules(field) {
    const rules = [];
    
    // Reglas básicas según atributos HTML
    if (field.hasAttribute('required')) {
      rules.push({ validator: 'required' });
    }
    
    if (field.type === 'email') {
      rules.push({ validator: 'email' });
    }
    
    if (field.type === 'tel') {
      rules.push({ validator: 'phone' });
    }
    
    if (field.type === 'date') {
      rules.push({ validator: 'date' });
    }
    
    if (field.tagName === 'SELECT') {
      rules.push({ validator: 'select' });
    }
    
    // Reglas de longitud
    const minLength = field.getAttribute('minlength') || (field.tagName === 'TEXTAREA' ? 10 : 2);
    const maxLength = field.getAttribute('maxlength') || (field.tagName === 'TEXTAREA' ? 500 : 100);
    
    if (field.type === 'text' || field.tagName === 'TEXTAREA') {
      rules.push({ validator: 'minLength', params: [parseInt(minLength)] });
      rules.push({ validator: 'maxLength', params: [parseInt(maxLength)] });
    }
    
    return rules;
  }

  // ===== CREACIÓN DE CONTENEDORES DE VALIDACIÓN =====
  createValidationContainer(field) {
    let container = document.getElementById(`${field.id}-validation`);
    
    if (!container) {
      container = document.createElement('div');
      container.id = `${field.id}-validation`;
      container.className = 'pixel-validation-container';
      container.innerHTML = `
        <div class="validation-feedback">
          <span class="validation-icon" aria-hidden="true"></span>
          <span class="validation-message" role="alert"></span>
        </div>
      `;
      
      // Insertar después del campo
      field.parentNode.insertBefore(container, field.nextSibling);
    }

    // Crear contador de caracteres para textareas
    if (field.tagName === 'TEXTAREA') {
      this.createCharacterCounter(field, container);
    }

    return container;
  }

  createCharacterCounter(field, container) {
    if (container.querySelector('.character-counter')) return;

    const maxLength = field.getAttribute('maxlength') || 500;
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.innerHTML = `
      <span class="counter-text">
        <span class="current-count">0</span>/<span class="max-count">${maxLength}</span>
      </span>
    `;
    
    container.appendChild(counter);
  }

  // ===== EVENTOS DE CAMPOS =====
  setupFieldEvents(field, fieldConfig, formConfig) {
    // Validación en tiempo real
    field.addEventListener('input', (e) => {
      this.debounceValidation(field, fieldConfig, formConfig);
      this.updateCharacterCounter(field);
    });

    // Validación al perder el foco
    field.addEventListener('blur', (e) => {
      fieldConfig.isDirty = true;
      this.validateField(field, fieldConfig, formConfig);
    });

    // Limpiar errores al enfocar
    field.addEventListener('focus', (e) => {
      this.clearFieldError(field);
    });
  }

  debounceValidation(field, fieldConfig, formConfig) {
    const timerId = this.debounceTimers.get(field.id);
    if (timerId) clearTimeout(timerId);

    this.debounceTimers.set(field.id, setTimeout(() => {
      if (fieldConfig.isDirty) {
        this.validateField(field, fieldConfig, formConfig);
      }
    }, 300));
  }

  // ===== VALIDACIÓN DE CAMPOS =====
  validateField(field, fieldConfig, formConfig) {
    const value = field.value;
    fieldConfig.lastValue = value;

    // Ejecutar todas las reglas
    for (const rule of fieldConfig.rules) {
      const validator = this.validators[rule.validator];
      if (!validator) continue;

      const result = validator(value, ...(rule.params || []));
      
      if (!result.isValid) {
        this.showFieldError(field, result.message);
        fieldConfig.isValid = false;
        this.updateFormState(formConfig);
        return false;
      }
    }

    // Si llegamos aquí, el campo es válido
    this.showFieldSuccess(field);
    fieldConfig.isValid = true;
    this.updateFormState(formConfig);
    return true;
  }

  // ===== VISUAL FEEDBACK =====
  showFieldError(field, message) {
    // Actualizar clases del campo
    field.classList.remove('field-neutral', 'field-valid');
    field.classList.add('field-invalid');

    // Actualizar contenedor de validación
    const container = document.getElementById(`${field.id}-validation`);
    if (container) {
      const feedback = container.querySelector('.validation-feedback');
      const icon = container.querySelector('.validation-icon');
      const messageEl = container.querySelector('.validation-message');

      feedback.className = 'validation-feedback validation-invalid';
      icon.innerHTML = '❌';
      messageEl.textContent = message;

      // Anunciar a screen readers
      messageEl.setAttribute('aria-live', 'polite');
    }
  }

  showFieldSuccess(field) {
    // Actualizar clases del campo
    field.classList.remove('field-neutral', 'field-invalid');
    field.classList.add('field-valid');

    // Actualizar contenedor de validación
    const container = document.getElementById(`${field.id}-validation`);
    if (container) {
      const feedback = container.querySelector('.validation-feedback');
      const icon = container.querySelector('.validation-icon');
      const messageEl = container.querySelector('.validation-message');

      feedback.className = 'validation-feedback validation-valid';
      icon.innerHTML = '✅';
      messageEl.textContent = '¡Perfecto!';
    }
  }

  clearFieldError(field) {
    // No cambiar estado, solo limpiar visuales si está en error
    const container = document.getElementById(`${field.id}-validation`);
    if (container && field.classList.contains('field-invalid')) {
      const messageEl = container.querySelector('.validation-message');
      if (messageEl) {
        messageEl.textContent = '';
        messageEl.removeAttribute('aria-live');
      }
    }
  }

  // ===== CONTADOR DE CARACTERES =====
  updateCharacterCounter(field) {
    if (field.tagName !== 'TEXTAREA') return;

    const container = document.getElementById(`${field.id}-validation`);
    const counter = container?.querySelector('.character-counter');
    if (!counter) return;

    const currentCount = field.value.length;
    const maxCount = field.getAttribute('maxlength') || 500;
    const currentCountEl = counter.querySelector('.current-count');
    
    if (currentCountEl) {
      currentCountEl.textContent = currentCount;
      
      // Estados del contador
      counter.classList.remove('counter-normal', 'counter-warning', 'counter-error');
      
      if (currentCount > maxCount) {
        counter.classList.add('counter-error');
      } else if (currentCount > maxCount * 0.9) {
        counter.classList.add('counter-warning');
      } else {
        counter.classList.add('counter-normal');
      }
    }
  }

  // ===== EVENTOS DE FORMULARIO =====
  setupFormEvents(formConfig) {
    formConfig.element.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(formConfig);
    });
  }

  updateFormState(formConfig) {
    const allFieldsValid = Array.from(formConfig.fields.values())
      .every(field => field.isValid);
    
    formConfig.isValid = allFieldsValid;
    
    // Actualizar botón de envío
    const submitBtn = formConfig.element.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !allFieldsValid;
      submitBtn.classList.toggle('opacity-60', !allFieldsValid);
    }
  }

  // ===== ENVÍO DE FORMULARIO =====
  handleFormSubmit(formConfig) {
    
    // Validar todos los campos antes del envío
    let allValid = true;
    formConfig.fields.forEach((fieldConfig, fieldId) => {
      const field = fieldConfig.element;
      fieldConfig.isDirty = true; // Marcar como touched
      if (!this.validateField(field, fieldConfig, formConfig)) {
        allValid = false;
      }
    });

    if (!allValid) {
      this.showFormError(formConfig.element, 'Por favor corrige los errores antes de continuar');
      this.focusFirstError(formConfig.element);
      return;
    }

    // Preparar datos del formulario
    const formData = new FormData(formConfig.element);
    const formObject = this.formDataToObject(formData);

    // Mostrar estado de carga
    this.showFormLoading(formConfig.element);

    // Emitir evento personalizado
    const event = new CustomEvent('pixelFormValidated', {
      detail: {
        isValid: true,
        formData: formData,
        formObject: formObject,
        formType: formConfig.type,
        formElement: formConfig.element
      }
    });

    formConfig.element.dispatchEvent(event);
    document.dispatchEvent(event);

  }

  // ===== ESTADOS DEL FORMULARIO =====
  showFormLoading(form) {
    form.classList.add('form-loading');
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('validation-loading');
      submitBtn.textContent = 'Enviando...';
    }
  }

  showFormSuccess(form, message = '¡Formulario enviado exitosamente!') {
    form.classList.remove('form-loading', 'form-error');
    form.classList.add('form-success');
    this.showNotification(message, 'success');
    this.resetFormState(form);
  }

  showFormError(form, message = 'Error al enviar el formulario') {
    form.classList.remove('form-loading', 'form-success');
    form.classList.add('form-error');
    this.showNotification(message, 'error');
    this.resetFormState(form);
  }

  resetFormState(form) {
    setTimeout(() => {
      form.classList.remove('form-loading', 'form-success', 'form-error');
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('validation-loading');
        submitBtn.textContent = submitBtn.getAttribute('data-original-text') || 'Enviar';
      }
    }, 3000);
  }

  // ===== UTILIDADES =====
  formDataToObject(formData) {
    const obj = {};
    for (let [key, value] of formData.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  focusFirstError(form) {
    const firstError = form.querySelector('.field-invalid');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  showNotification(message, type = 'info') {
    // Crear notificación toast
    const notification = document.createElement('div');
    notification.className = `pixel-notification notification-${type} show`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    document.body.appendChild(notification);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      notification.classList.replace('show', 'hide');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }

  // ===== EVENTOS GLOBALES =====
  setupGlobalEvents() {
    // Detectar navegación por teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // ===== API PÚBLICA =====
  getFormState(formId) {
    return this.forms.get(formId);
  }

  validateForm(formId) {
    const formConfig = this.forms.get(formId);
    if (formConfig) {
      this.handleFormSubmit(formConfig);
    }
  }

  resetForm(formId) {
    const formConfig = this.forms.get(formId);
    if (formConfig) {
      formConfig.element.reset();
      formConfig.fields.forEach((fieldConfig) => {
        fieldConfig.isValid = false;
        fieldConfig.isDirty = false;
        fieldConfig.element.classList.remove('field-valid', 'field-invalid');
        fieldConfig.element.classList.add('field-neutral');
      });
    }
  }

  destroy() {
    this.forms.clear();
    this.debounceTimers.clear();
  }
}

// ===== INICIALIZACIÓN GLOBAL =====
window.PixelValidationManager = PixelValidationManager;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PVM = new PixelValidationManager();
  });
} else {
  window.PVM = new PixelValidationManager();
}

