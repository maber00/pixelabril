/**
 * PIXEL VALIDATION STANDALONE - SOLUCIÓN INMEDIATA
 * Sistema de validación independiente que funciona sin el sistema de init
 * 
 * INSTRUCCIONES:
 * 1. Guarda este archivo como: public/scripts/pixel-validation-standalone.js
 * 2. Carga SOLO este archivo en Layout.astro
 * 3. El contador funcionará inmediatamente
 */

(function() {
  'use strict';
  
  // Evitar ejecución múltiple
  if (window.PIXEL_VALIDATION_LOADED) {
    console.log('⚠️ PixelValidation ya cargado, saltando...');
    return;
  }

  console.log('🚀 Cargando PixelValidation STANDALONE...');

  // ===== CONFIGURACIÓN =====
  const config = {
    debounceTime: 300,
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
      maxLength: 'Máximo {max} caracteres'
    }
  };

  // ===== VALIDADORES =====
  const validators = {
    required: (value) => ({
      isValid: value.trim().length > 0,
      message: config.messages.required
    }),
    
    email: (value) => ({
      isValid: config.patterns.email.test(value),
      message: config.messages.email
    }),
    
    phone: (value) => {
      const cleanPhone = value.replace(/\D/g, '');
      return {
        isValid: config.patterns.phone.test(cleanPhone),
        message: config.messages.phone
      };
    },
    
    name: (value) => ({
      isValid: config.patterns.name.test(value) && value.length >= 2,
      message: value.length < 2 ? 
               config.messages.minLength.replace('{min}', '2') :
               config.messages.name
    }),
    
    minLength: (value, min = 2) => ({
      isValid: value.trim().length >= min,
      message: config.messages.minLength.replace('{min}', min)
    }),
    
    maxLength: (value, max = 500) => ({
      isValid: value.length <= max,
      message: config.messages.maxLength.replace('{max}', max)
    })
  };

  // ===== UTILIDADES =====
  let debounceTimers = new Map();

  function clearDebounce(fieldId) {
    if (debounceTimers.has(fieldId)) {
      clearTimeout(debounceTimers.get(fieldId));
      debounceTimers.delete(fieldId);
    }
  }

  function createValidationContainer(field) {
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
      
      field.parentNode.insertBefore(container, field.nextSibling);
    }

    // Crear contador de caracteres para textareas
    if (field.tagName === 'TEXTAREA') {
      createCharacterCounter(field, container);
    }

    return container;
  }

  function createCharacterCounter(field, container) {
    // Evitar duplicar contador
    if (container.querySelector('.character-counter')) return;

    const maxLength = field.getAttribute('maxlength') || config.maxMessageLength;
    const counter = document.createElement('div');
    counter.className = 'character-counter counter-normal';
    counter.innerHTML = `
      <span class="counter-text">
        <span class="current-count">0</span>/<span class="max-count">${maxLength}</span> caracteres
      </span>
    `;
    
    container.appendChild(counter);
    
    console.log(`✅ Contador creado para ${field.id}: 0/${maxLength}`);
  }

  // ===== CONTADOR DE CARACTERES =====
  function updateCharacterCounter(field) {
    if (field.tagName !== 'TEXTAREA') return;

    const container = document.getElementById(`${field.id}-validation`);
    const counter = container?.querySelector('.character-counter');
    if (!counter) {
      console.warn(`❌ No se encontró contador para ${field.id}`);
      return;
    }

    const currentCount = field.value.length;
    const maxCount = parseInt(field.getAttribute('maxlength')) || config.maxMessageLength;
    const remaining = maxCount - currentCount;
    
    // Actualizar números
    const currentCountEl = counter.querySelector('.current-count');
    const maxCountEl = counter.querySelector('.max-count');
    
    if (currentCountEl) currentCountEl.textContent = currentCount;
    if (maxCountEl) maxCountEl.textContent = maxCount;
    
    // Estados del contador
    counter.classList.remove('counter-normal', 'counter-warning', 'counter-error');
    
    if (currentCount > maxCount) {
      counter.classList.add('counter-error');
    } else if (remaining <= 20) {
      counter.classList.add('counter-warning');
    } else {
      counter.classList.add('counter-normal');
    }

    // Mensaje adicional
    const counterText = counter.querySelector('.counter-text');
    if (remaining <= 20 && remaining >= 0) {
      counterText.innerHTML = `
        <span class="current-count">${currentCount}</span>/<span class="max-count">${maxCount}</span> caracteres
        <span class="remaining-text" style="color: #d97706; font-weight: 600; margin-left: 0.25rem;">(${remaining} restantes)</span>
      `;
    } else if (currentCount > maxCount) {
      const excess = currentCount - maxCount;
      counterText.innerHTML = `
        <span class="current-count">${currentCount}</span>/<span class="max-count">${maxCount}</span> caracteres
        <span class="excess-text" style="color: #dc2626; font-weight: 600; margin-left: 0.25rem;">(${excess} de más)</span>
      `;
    } else {
      counterText.innerHTML = `
        <span class="current-count">${currentCount}</span>/<span class="max-count">${maxCount}</span> caracteres
      `;
    }

    console.log(`📊 Contador actualizado ${field.id}: ${currentCount}/${maxCount}`);
  }

  // ===== VALIDACIÓN =====
  function validateField(field, showErrors = true) {
    const value = field.value.trim();
    let isValid = true;
    let firstError = null;

    // Obtener reglas de validación
    const rules = [];
    
    if (field.hasAttribute('required')) {
      rules.push({ validator: 'required' });
    }
    
    if (field.type === 'email') {
      rules.push({ validator: 'email' });
    }
    
    if (field.type === 'tel') {
      rules.push({ validator: 'phone' });
    }
    
    if (field.name === 'nombre' || field.id === 'nombre') {
      rules.push({ validator: 'name' });
    }
    
    const minLength = field.getAttribute('minlength') || (field.tagName === 'TEXTAREA' ? 10 : 2);
    const maxLength = field.getAttribute('maxlength') || (field.tagName === 'TEXTAREA' ? 500 : 100);
    
    if (field.type === 'text' || field.tagName === 'TEXTAREA') {
      rules.push({ validator: 'minLength', params: [parseInt(minLength)] });
      rules.push({ validator: 'maxLength', params: [parseInt(maxLength)] });
    }

    // Ejecutar validaciones
    for (const rule of rules) {
      const validator = validators[rule.validator];
      if (!validator) continue;

      const result = rule.params ? 
        validator(value, ...rule.params) : 
        validator(value);

      if (!result.isValid) {
        isValid = false;
        firstError = result.message;
        break;
      }
    }

    // Mostrar feedback visual
    if (showErrors) {
      if (isValid) {
        showFieldSuccess(field);
      } else if (firstError) {
        showFieldError(field, firstError);
      }
    }

    return { isValid, error: firstError };
  }

  function showFieldError(field, message) {
    field.classList.remove('field-neutral', 'field-valid');
    field.classList.add('field-invalid');

    const container = document.getElementById(`${field.id}-validation`);
    if (container) {
      const feedback = container.querySelector('.validation-feedback');
      const icon = container.querySelector('.validation-icon');
      const messageEl = container.querySelector('.validation-message');

      if (feedback) feedback.className = 'validation-feedback validation-invalid';
      if (icon) icon.innerHTML = '❌';
      if (messageEl) {
        messageEl.textContent = message;
        messageEl.style.color = '#dc2626';
      }
    }
  }

  function showFieldSuccess(field) {
    field.classList.remove('field-neutral', 'field-invalid');
    field.classList.add('field-valid');

    const container = document.getElementById(`${field.id}-validation`);
    if (container) {
      const feedback = container.querySelector('.validation-feedback');
      const icon = container.querySelector('.validation-icon');
      const messageEl = container.querySelector('.validation-message');

      if (feedback) feedback.className = 'validation-feedback validation-valid';
      if (icon) icon.innerHTML = '✅';
      if (messageEl) {
        messageEl.textContent = '¡Perfecto!';
        messageEl.style.color = '#059669';
      }
    }
  }

  // ===== INICIALIZACIÓN DE FORMULARIOS =====
  function initForm(form) {
    console.log(`🎯 Inicializando formulario: ${form.id}`);
    
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      // Crear contenedor de validación
      createValidationContainer(field);
      
      // Eventos de validación
      field.addEventListener('input', (e) => {
        clearDebounce(field.id);
        
        // Actualizar contador inmediatamente
        if (field.tagName === 'TEXTAREA') {
          updateCharacterCounter(field);
        }

        // Validación con debounce
        debounceTimers.set(field.id, setTimeout(() => {
          validateField(field, false);
        }, config.debounceTime));
      });

      field.addEventListener('blur', () => {
        clearDebounce(field.id);
        validateField(field, true);
      });

      // Inicializar contador si es textarea
      if (field.tagName === 'TEXTAREA') {
        updateCharacterCounter(field);
      }
    });

    // Submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let allValid = true;
      let firstInvalidField = null;
      
      fields.forEach(field => {
        const result = validateField(field, true);
        if (!result.isValid && !firstInvalidField) {
          firstInvalidField = field;
          allValid = false;
        }
      });

      if (allValid) {
        console.log('✅ Formulario válido, procesando...');
        
        // Emitir evento personalizado
        const formData = new FormData(form);
        const event = new CustomEvent('pixelFormValidated', {
          detail: {
            isValid: true,
            formData: formData,
            formElement: form
          }
        });
        
        form.dispatchEvent(event);
        document.dispatchEvent(event);
        
      } else {
        console.log('❌ Formulario inválido');
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
      }
    });
  }

  // ===== INICIALIZACIÓN PRINCIPAL =====
  function init() {
    console.log('🔧 Inicializando sistema de validación...');
    
    // Buscar formularios existentes
    const forms = document.querySelectorAll('form[data-form-type]');
    console.log(`📋 Formularios encontrados: ${forms.length}`);
    
    forms.forEach(form => {
      initForm(form);
    });

    // Observer para formularios dinámicos
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.tagName === 'FORM' && node.getAttribute('data-form-type')) {
            initForm(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // API global para testing manual
    window.PIXEL_VALIDATION = {
      updateCharacterCounter: updateCharacterCounter,
      validateField: validateField,
      config: config,
      validators: validators
    };

    console.log('✅ Sistema de validación inicializado correctamente');
    console.log('🧪 API disponible en: window.PIXEL_VALIDATION');
  }

  // ===== ESTILOS CSS CRÍTICOS =====
  function injectCriticalStyles() {
    const styles = `
      /* Estilos críticos para validación */
      .field-valid {
        border-color: #059669 !important;
        box-shadow: 0 0 0 1px #059669 !important;
        background-color: rgba(5, 150, 105, 0.05) !important;
      }
      
      .field-invalid {
        border-color: #dc2626 !important;
        box-shadow: 0 0 0 1px #dc2626 !important;
        background-color: rgba(220, 38, 38, 0.05) !important;
      }
      
      .pixel-validation-container {
        margin-top: 0.5rem;
        min-height: 1.5rem;
      }
      
      .validation-feedback {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }
      
      .character-counter {
        margin-top: 0.25rem;
        font-size: 0.75rem;
        transition: color 0.2s ease;
      }
      
      .character-counter.counter-normal { color: #6b7280; }
      .character-counter.counter-warning { color: #d97706; font-weight: 600; }
      .character-counter.counter-error { color: #dc2626; font-weight: 600; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    console.log('🎨 Estilos críticos inyectados');
  }

  // ===== INICIALIZACIÓN AUTOMÁTICA =====
  function autoInit() {
    // Inyectar estilos críticos
    injectCriticalStyles();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // Marcar como cargado
    window.PIXEL_VALIDATION_LOADED = true;
    
    console.log('🎉 PixelValidation STANDALONE listo!');
  }

  // ===== EJECUTAR =====
  autoInit();

})();

/**
 * SOLUCIÓN INMEDIATA: Evitar redirección de Formspree
 * 
 * INSTRUCCIONES:
 * 1. Agrega este código a tu archivo pixel-validation-standalone.js
 * 2. O créalo como archivo separado y cárgalo después del validation
 * 3. Reemplaza la función de envío para usar AJAX en lugar de submit normal
 */

(function() {
  'use strict';

  console.log('🛑 Cargando fix anti-redirección Formspree...');

  // ===== CONFIGURACIÓN =====
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeokkypj'; // Tu endpoint actual
  const WHATSAPP_NUMBER = '573195895858'; // Tu número de WhatsApp

  // ===== FUNCIÓN DE ENVÍO SIN REDIRECCIÓN =====
  function enviarFormularioSinRedireccion(formElement, formData) {
    return new Promise(async (resolve, reject) => {
      try {
        // Preparar datos para Formspree con configuración anti-redirección
        const formspreeData = new FormData();
        
        // Copiar todos los datos del formulario
        for (let [key, value] of formData.entries()) {
          formspreeData.append(key, value);
        }
        
        // Configuraciones especiales de Formspree
        formspreeData.append('_replyto', formData.get('email')); // Responder a este email
        formspreeData.append('_subject', `Nueva consulta de ${formData.get('nombre')} - Pixel Living`);
        formspreeData.append('_next', 'javascript:void(0)'); // NO redirigir
        formspreeData.append('_format', 'plain'); // Formato plain text
        formspreeData.append('_language', 'es'); // Idioma español
        
        console.log('📤 Enviando a Formspree vía AJAX...');
        
        // Enviar vía FETCH (AJAX) en lugar de submit normal
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: formspreeData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          console.log('✅ Formspree: Enviado exitosamente');
          resolve(response);
        } else {
          console.warn('⚠️ Formspree: Respuesta no exitosa', response.status);
          // Aún así continuar con WhatsApp
          resolve(response);
        }

      } catch (error) {
        console.warn('⚠️ Error Formspree (continuando con WhatsApp):', error);
        // No fallar, solo continuar
        resolve(null);
      }
    });
  }

  // ===== CREAR MENSAJE WHATSAPP =====
  function crearMensajeWhatsApp(formData, tipoFormulario = 'general') {
    const nombre = formData.get('nombre') || 'Usuario';
    const email = formData.get('email') || 'No proporcionado';
    const telefono = formData.get('telefono') || 'No proporcionado';
    const fecha = formData.get('fecha') || 'Por definir';
    const estadia = formData.get('estadia') || 'Por definir';
    const personas = formData.get('personas') || '1';
    const expectativas = formData.get('expectativas') || formData.get('mensaje') || 'Sin mensaje adicional';
    const estudio = formData.get('estudio') || 'Consulta general';

    const mensaje = `🏠 *CONSULTA PIXEL LIVING*
📍 ${estudio}

👤 *DATOS PERSONALES:*
• Nombre: ${nombre}
• Email: ${email}
• Teléfono: ${telefono}

📅 *DETALLES:*
• Fecha ingreso: ${fecha}
• Duración: ${estadia}
• Personas: ${personas}

💬 *MENSAJE:*
${expectativas}

---
📧 Copia enviada por email
⏰ ${new Date().toLocaleString('es-CO')}
🌐 pixelliving.co`;

    return mensaje;
  }

  // ===== MOSTRAR MENSAJE DE ÉXITO =====
  function mostrarMensajeExito(formElement, mensaje = '¡Enviado exitosamente!') {
    // Buscar o crear contenedor de mensajes
    let messageContainer = formElement.parentNode.querySelector('.success-message');
    
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = 'success-message';
      formElement.parentNode.insertBefore(messageContainer, formElement);
    }

    messageContainer.innerHTML = `
      <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
        <div class="flex items-center">
          <span class="text-lg mr-2">✅</span>
          <div>
            <p class="font-medium">${mensaje}</p>
            <p class="text-sm mt-1">WhatsApp se abrirá en unos segundos para confirmar tu solicitud.</p>
          </div>
        </div>
      </div>
    `;

    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-ocultar después de 10 segundos
    setTimeout(() => {
      if (messageContainer) {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
          if (messageContainer && messageContainer.parentNode) {
            messageContainer.parentNode.removeChild(messageContainer);
          }
        }, 500);
      }
    }, 10000);
  }

  // ===== REEMPLAZAR SUBMIT HANDLER =====
  function interceptarFormularios() {
    const formularios = document.querySelectorAll('form[data-form-type]');
    
    console.log(`🎯 Interceptando ${formularios.length} formularios...`);

    formularios.forEach(form => {
      // Remover listeners anteriores
      const nuevoForm = form.cloneNode(true);
      form.parentNode.replaceChild(nuevoForm, form);

      // Agregar nuevo listener que evita redirección
      nuevoForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // CRUCIAL: Evitar submit normal
        e.stopPropagation();

        console.log('🚀 Procesando envío sin redirección...');

        const boton = nuevoForm.querySelector('button[type="submit"]');
        const textoOriginal = boton ? boton.textContent : '';
        
        // Estado de carga
        if (boton) {
          boton.textContent = 'Enviando...';
          boton.disabled = true;
        }

        try {
          // Obtener datos del formulario
          const formData = new FormData(nuevoForm);
          
          // Log para debug
          console.log('📋 Datos del formulario:', Object.fromEntries(formData));

          // 1. Enviar a Formspree sin redirección
          console.log('📤 Enviando a Formspree...');
          await enviarFormularioSinRedireccion(nuevoForm, formData);

          // 2. Crear mensaje WhatsApp
          const mensajeWhatsApp = crearMensajeWhatsApp(formData);
          console.log('📱 Mensaje WhatsApp preparado');

          // 3. Mostrar éxito
          mostrarMensajeExito(nuevoForm, '¡Solicitud enviada exitosamente!');

          // 4. Abrir WhatsApp después de un momento
          setTimeout(() => {
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensajeWhatsApp)}`;
            console.log('🔗 Abriendo WhatsApp:', whatsappUrl);
            window.open(whatsappUrl, '_blank');
          }, 2000);

          // 5. Resetear formulario
          setTimeout(() => {
            nuevoForm.reset();
            if (boton) {
              boton.textContent = textoOriginal;
              boton.disabled = false;
            }
          }, 3000);

          console.log('✅ Proceso completado sin redirección');

        } catch (error) {
          console.error('❌ Error en el proceso:', error);
          
          // Mostrar error pero aún ofrecer WhatsApp
          mostrarMensajeExito(nuevoForm, 'Hubo un problema técnico. Te redirigimos a WhatsApp...');
          
          setTimeout(() => {
            const mensajeWhatsApp = crearMensajeWhatsApp(new FormData(nuevoForm));
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensajeWhatsApp)}`;
            window.open(whatsappUrl, '_blank');
          }, 1000);

        } finally {
          // Siempre restaurar botón
          if (boton) {
            setTimeout(() => {
              boton.textContent = textoOriginal;
              boton.disabled = false;
            }, 5000);
          }
        }
      });

      console.log(`✅ Formulario ${nuevoForm.id} interceptado`);
    });
  }

  // ===== INICIALIZACIÓN =====
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', interceptarFormularios);
    } else {
      interceptarFormularios();
    }

    // Observer para formularios que se agreguen dinámicamente
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.tagName === 'FORM' && node.getAttribute('data-form-type')) {
            console.log('🆕 Nuevo formulario detectado, interceptando...');
            interceptarFormularios();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Marcar como cargado
    window.FORMSPREE_REDIRECT_FIX_LOADED = true;
  }

  // ===== EJECUTAR =====
  if (!window.FORMSPREE_REDIRECT_FIX_LOADED) {
    init();
    console.log('✅ Fix anti-redirección Formspree activado');
  }

})();