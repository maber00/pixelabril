/**
 * PIXEL FORM UNIFIED - VERSIÓN CORREGIDA SIN BLOQUEOS
 * Sistema unificado de formularios que NO bloquea las cajas de formulario
 * 
 * IMPORTANTE: Reemplaza completamente el archivo anterior
 */

(function() {
  'use strict';

  // ===== PREVENIR MÚLTIPLES EJECUCIONES =====
  if (window.PIXEL_FORM_UNIFIED_LOADED) {
    console.log('⚠️ PixelFormUnified ya cargado, saltando inicialización');
    return;
  }

  console.log('🚀 Cargando PixelFormUnified CORREGIDO...');

  // ===== CONFIGURACIÓN =====
  const CONFIG = {
    formspree: {
      endpoint: 'https://formspree.io/f/xeokkypj',
      timeout: 10000
    },
    whatsapp: {
      number: '573195895858',
      baseUrl: 'https://wa.me/'
    },
    validation: {
      debounceTime: 300,
      maxMessageLength: 500,
      patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[0-9]{10}$/,
        name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
      }
    }
  };

  // ===== VARIABLES GLOBALES =====
  let debounceTimers = new Map();
  let initializedForms = new Set();

  // ===== UTILIDADES DEFENSIVAS =====
  function safeQuerySelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.warn('Error en selector:', selector, error);
      return null;
    }
  }

  function safeQuerySelectorAll(selector) {
    try {
      return document.querySelectorAll(selector);
    } catch (error) {
      console.warn('Error en selector:', selector, error);
      return [];
    }
  }

  function extractFormData(form) {
    const data = {};
    
    try {
      const formData = new FormData(form);
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
      
      // Detectar estudio automáticamente
      if (!data.estudio) {
        const estudioInput = safeQuerySelector('input[name="estudio"]');
        if (estudioInput && estudioInput.value) {
          data.estudio = estudioInput.value;
        } else {
          // Buscar en URL
          const path = window.location.pathname;
          if (path.includes('/estudios/')) {
            const estudioId = path.split('/estudios/')[1];
            const estudiosMap = {
              'jade': 'Estudio Jade',
              'zian': 'Estudio Zian', 
              'indigo': 'Estudio Índigo',
            };
            data.estudio = estudiosMap[estudioId] || 'Consulta general';
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error extrayendo datos del formulario:', error);
      return {};
    }
  }

  // ===== CONTADOR DE CARACTERES =====
  function createCharacterCounter(field) {
    if (field.tagName !== 'TEXTAREA') return;
    
    // Buscar contenedor existente
    let container = safeQuerySelector(`#${field.id}-validation`);
    
    if (!container) {
      container = document.createElement('div');
      container.id = `${field.id}-validation`;
      container.className = 'pixel-validation-container';
      
      // Insertar de forma segura
      try {
        field.parentNode.insertBefore(container, field.nextSibling);
      } catch (error) {
        console.warn('No se pudo insertar contenedor de validación:', error);
        return;
      }
    }

    // Verificar si ya existe contador
    if (container.querySelector('.character-counter')) {
      return;
    }

    const maxLength = field.getAttribute('maxlength') || CONFIG.validation.maxMessageLength;
    const counter = document.createElement('div');
    counter.className = 'character-counter counter-normal';
    counter.innerHTML = `
      <span class="counter-text">
        <span class="current-count">0</span>/<span class="max-count">${maxLength}</span> caracteres
      </span>
    `;
    
    container.appendChild(counter);
    console.log(`✅ Contador creado para ${field.id}`);
  }

  function updateCharacterCounter(field) {
    if (!field || field.tagName !== 'TEXTAREA') return;

    const container = safeQuerySelector(`#${field.id}-validation`);
    const counter = container?.querySelector('.character-counter');
    if (!counter) return;

    try {
      const currentCount = field.value.length;
      const maxCount = parseInt(field.getAttribute('maxlength')) || CONFIG.validation.maxMessageLength;
      const remaining = maxCount - currentCount;
      
      // Actualizar números de forma segura
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
      if (counterText) {
        if (remaining <= 20 && remaining >= 0) {
          counterText.innerHTML = `
            <span class="current-count">${currentCount}</span>/<span class="max-count">${maxCount}</span> caracteres
            <span style="color: #d97706; font-weight: 600; margin-left: 0.25rem;">(${remaining} restantes)</span>
          `;
        } else if (currentCount > maxCount) {
          const excess = currentCount - maxCount;
          counterText.innerHTML = `
            <span class="current-count">${currentCount}</span>/<span class="max-count">${maxCount}</span> caracteres
            <span style="color: #dc2626; font-weight: 600; margin-left: 0.25rem;">(${excess} de más)</span>
          `;
        } else {
          counterText.innerHTML = `
            <span class="current-count">${currentCount}</span>/<span class="max-count">${maxCount}</span> caracteres
          `;
        }
      }
    } catch (error) {
      console.warn('Error actualizando contador:', error);
    }
  }

  // ===== ENVÍO DE FORMULARIOS =====
  async function sendToFormspree(data) {
    try {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      formData.append('_replyto', data.email || '');
      formData.append('_subject', `Nueva consulta de ${data.nombre || 'Usuario'} - Pixel Living`);
      formData.append('_language', 'es');
      
      const response = await fetch(CONFIG.formspree.endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Formspree: Enviado exitosamente');
        return true;
      } else {
        console.warn('⚠️ Formspree: Error', response.status);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Error Formspree:', error);
      return false;
    }
  }

  function createWhatsAppMessage(data) {
    const {
      nombre = 'Usuario',
      email = 'No proporcionado', 
      telefono = 'No proporcionado',
      fecha = 'Por definir',
      estadia = 'Por definir',
      personas = '1',
      expectativas = 'Sin mensaje',
      mensaje = '',
      estudio = 'Consulta general'
    } = data;

    const textoMensaje = expectativas || mensaje || 'Sin mensaje adicional';

    return `🏠 *SOLICITUD RESERVA PIXEL LIVING*
📍 ${estudio}

👤 *DATOS PERSONALES:*
- Nombre: ${nombre}
- Email: ${email}
- Teléfono: ${telefono}

📅 *DETALLES:*
- Fecha ingreso: ${fecha}
- Duración: ${estadia}
- Personas: ${personas}

💬 *MENSAJE:*
${textoMensaje}

---
📧 Copia enviada por email
⏰ ${new Date().toLocaleString('es-CO')}
🌐 pixelliving.co`;
  }

  function showSuccessMessage(form, message = '¡Solicitud enviada exitosamente!') {
    try {
      let messageContainer = form.parentNode.querySelector('.success-message');
      
      if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'success-message';
        form.parentNode.insertBefore(messageContainer, form);
      }

      messageContainer.innerHTML = `
        <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
          <div class="flex items-center">
            <span class="text-lg mr-2">✅</span>
            <div>
              <p class="font-medium">${message}</p>
              <p class="text-sm mt-1">WhatsApp se abrirá en unos segundos para confirmar tu solicitud.</p>
            </div>
          </div>
        </div>
      `;

      messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Auto-ocultar
      setTimeout(() => {
        if (messageContainer && messageContainer.parentNode) {
          messageContainer.style.opacity = '0';
          setTimeout(() => {
            if (messageContainer && messageContainer.parentNode) {
              messageContainer.parentNode.removeChild(messageContainer);
            }
          }, 500);
        }
      }, 10000);
    } catch (error) {
      console.warn('Error mostrando mensaje de éxito:', error);
    }
  }

  // ===== INICIALIZACIÓN DE FORMULARIOS (CORREGIDA) =====
  function initForm(form) {
    const formId = form.id || `form-${Date.now()}`;
    
    // Evitar inicialización múltiple
    if (initializedForms.has(formId)) {
      console.log(`⚠️ Formulario ${formId} ya inicializado, saltando...`);
      return;
    }
    
    console.log(`🎯 Inicializando formulario: ${formId}`);
    
    try {
      const fields = form.querySelectorAll('input, textarea, select');
      
      // Inicializar campos con protección contra errores
      fields.forEach(field => {
        try {
          // Crear contador para textareas
          if (field.tagName === 'TEXTAREA') {
            createCharacterCounter(field);
            
            // Evento de input para contador
            field.addEventListener('input', () => {
              updateCharacterCounter(field);
            });
            
            // Inicializar contador
            updateCharacterCounter(field);
          }
          
        } catch (error) {
          console.warn(`Error inicializando campo ${field.id}:`, error);
        }
      });

      // Submit handler ROBUSTO
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🚀 Procesando envío de formulario...');

        const boton = form.querySelector('button[type="submit"]');
        const textoOriginal = boton ? boton.textContent : '';
        
        try {
          // Estado de carga
          if (boton) {
            boton.textContent = 'Enviando...';
            boton.disabled = true;
          }

          // Extraer datos
          const data = extractFormData(form);
          console.log('📋 Datos extraídos:', data);

          // Validación básica
          if (!data.nombre || !data.email) {
            throw new Error('Faltan datos obligatorios');
          }

          // Enviar a Formspree
          console.log('📤 Enviando a Formspree...');
          await sendToFormspree(data);

          // Crear mensaje WhatsApp
          const whatsappMessage = createWhatsAppMessage(data);
          
          // Mostrar éxito
          showSuccessMessage(form);

          // Abrir WhatsApp
          setTimeout(() => {
            const whatsappUrl = `${CONFIG.whatsapp.baseUrl}${CONFIG.whatsapp.number}?text=${encodeURIComponent(whatsappMessage)}`;
            console.log('🔗 Abriendo WhatsApp');
            window.open(whatsappUrl, '_blank');
          }, 2000);

          // Resetear formulario
          setTimeout(() => {
            form.reset();
            // Re-inicializar contadores
            fields.forEach(field => {
              if (field.tagName === 'TEXTAREA') {
                updateCharacterCounter(field);
              }
            });
          }, 3000);

          console.log('✅ Envío completado exitosamente');

        } catch (error) {
          console.error('❌ Error en envío:', error);
          showSuccessMessage(form, 'Hubo un problema técnico. Te redirigimos a WhatsApp...');
          
          setTimeout(() => {
            const data = extractFormData(form);
            const whatsappMessage = createWhatsAppMessage(data);
            const whatsappUrl = `${CONFIG.whatsapp.baseUrl}${CONFIG.whatsapp.number}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank');
          }, 1000);

        } finally {
          // Restaurar botón
          if (boton) {
            setTimeout(() => {
              boton.textContent = textoOriginal;
              boton.disabled = false;
            }, 5000);
          }
        }
      });

      // Marcar como inicializado
      initializedForms.add(formId);
      console.log(`✅ Formulario ${formId} inicializado correctamente`);

    } catch (error) {
      console.error(`❌ Error inicializando formulario ${formId}:`, error);
    }
  }

  // ===== INICIALIZACIÓN PRINCIPAL =====
  function init() {
    console.log('🔧 Inicializando sistema unificado (versión corregida)...');
    
    try {
      // Buscar formularios de forma segura
      const forms = safeQuerySelectorAll('form[data-form-type], form[id*="reserva"], form[id*="contacto"]');
      console.log(`📋 Formularios encontrados: ${forms.length}`);
      
      // Inicializar cada formulario
      forms.forEach(form => {
        try {
          initForm(form);
        } catch (error) {
          console.error('Error inicializando formulario individual:', error);
        }
      });

      // Observer para formularios dinámicos
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.tagName === 'FORM') {
              try {
                console.log('🆕 Nuevo formulario detectado');
                initForm(node);
              } catch (error) {
                console.error('Error inicializando formulario dinámico:', error);
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('✅ Sistema unificado inicializado (sin bloqueos)');

    } catch (error) {
      console.error('❌ Error en inicialización principal:', error);
    }
  }

  // ===== API GLOBAL =====
  window.PIXEL_FORM_UNIFIED = {
    updateCharacterCounter: updateCharacterCounter,
    extractFormData: extractFormData,
    createWhatsAppMessage: createWhatsAppMessage,
    initForm: initForm
  };

  // ===== INICIALIZACIÓN AUTOMÁTICA =====
  function autoInit() {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
      
      // Marcar como cargado
      window.PIXEL_FORM_UNIFIED_LOADED = true;
      console.log('🎉 PixelFormUnified CORREGIDO listo - Sin bloqueos');

    } catch (error) {
      console.error('❌ Error en auto-inicialización:', error);
    }
  }

  // ===== EJECUTAR =====
  autoInit();

})();