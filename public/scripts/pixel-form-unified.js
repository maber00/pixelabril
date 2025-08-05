/**
 * PIXEL FORM UNIFIED - VERSIÓN CORREGIDA SIN BLOQUEOS
 * Sistema unificado de formularios que NO bloquea las cajas de formulario
 * 
 * IMPORTANTE: Reemplaza completamente el archivo anterior
 */

(function() {
  'use strict';

  if (window.PIXEL_FORM_UNIFIED_LOADED) {
    return;
  }


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
      return null;
    }
  }

  function safeQuerySelectorAll(selector) {
    try {
      return document.querySelectorAll(selector);
    } catch (error) {
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
      return {};
    }
  }

  function createCharacterCounter(field) {
    if (field.tagName !== 'TEXTAREA') return;
    
    let container = safeQuerySelector(`#${field.id}-validation`);
    
    if (!container) {
      container = document.createElement('div');
      container.id = `${field.id}-validation`;
      container.className = 'pixel-validation-container';
      
      try {
        field.parentNode.insertBefore(container, field.nextSibling);
      } catch (error) {
        return;
      }
    }

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
    }
  }

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
        return true;
      } else {
        return false;
      }
    } catch (error) {
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
    }
  }

  function initForm(form) {
    const formId = form.id || `form-${Date.now()}`;
    
    if (initializedForms.has(formId)) {
      return;
    }
    
    
    try {
      const fields = form.querySelectorAll('input, textarea, select');
      
      fields.forEach(field => {
        try {
          if (field.tagName === 'TEXTAREA') {
            createCharacterCounter(field);
            
            field.addEventListener('input', () => {
              updateCharacterCounter(field);
            });
            
            updateCharacterCounter(field);
          }
          
        } catch (error) {
        }
      });

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();


        const boton = form.querySelector('button[type="submit"]');
        const textoOriginal = boton ? boton.textContent : '';
        
        try {
          if (boton) {
            boton.textContent = 'Enviando...';
            boton.disabled = true;
          }

          const data = extractFormData(form);

          if (!data.nombre || !data.email) {
            throw new Error('Faltan datos obligatorios');
          }

          await sendToFormspree(data);

          const whatsappMessage = createWhatsAppMessage(data);
          
          showSuccessMessage(form);

          // Abrir WhatsApp
          setTimeout(() => {
            const whatsappUrl = `${CONFIG.whatsapp.baseUrl}${CONFIG.whatsapp.number}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank');
          }, 2000);

          setTimeout(() => {
            form.reset();
            fields.forEach(field => {
              if (field.tagName === 'TEXTAREA') {
                updateCharacterCounter(field);
              }
            });
          }, 3000);


        } catch (error) {
          showSuccessMessage(form, 'Hubo un problema técnico. Te redirigimos a WhatsApp...');
          
          setTimeout(() => {
            const data = extractFormData(form);
            const whatsappMessage = createWhatsAppMessage(data);
            const whatsappUrl = `${CONFIG.whatsapp.baseUrl}${CONFIG.whatsapp.number}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank');
          }, 1000);

        } finally {
          if (boton) {
            setTimeout(() => {
              boton.textContent = textoOriginal;
              boton.disabled = false;
            }, 5000);
          }
        }
      });

      initializedForms.add(formId);

    } catch (error) {
    }
  }

  function init() {
    
    try {
      const forms = safeQuerySelectorAll('form[data-form-type], form[id*="reserva"], form[id*="contacto"]');
      
      forms.forEach(form => {
        try {
          initForm(form);
        } catch (error) {
        }
      });

      // Observer para formularios dinámicos
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.tagName === 'FORM') {
              try {
                initForm(node);
              } catch (error) {
              }
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });


    } catch (error) {
    }
  }

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

    } catch (error) {
    }
  }

  autoInit();

})();