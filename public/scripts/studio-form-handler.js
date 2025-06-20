// public/scripts/studio-form-handler.js
/**
 * MANEJADOR DE FORMULARIOS DE ESTUDIOS ESPECÍFICOS
 * Conecta los botones de "Solicita tu Estudio X ahora" con el sistema de envío
 */

class StudioFormHandler {
  constructor() {
    this.config = window.PIXEL_CONFIG || {};
    this.currentStudio = null;
    this.init();
  }

  init() {
    console.log('🏠 Inicializando StudioFormHandler...');
    this.detectCurrentStudio();
    this.setupFormListeners();
    this.setupStudioButtons();
  }

  // ===== DETECTAR ESTUDIO ACTUAL =====
  detectCurrentStudio() {
    // Detectar desde la URL
    const path = window.location.pathname;
    const studioMatch = path.match(/\/estudios\/(jade|zian|indigo|ambar)/);
    
    if (studioMatch) {
      this.currentStudio = {
        id: studioMatch[1],
        nombre: this.getStudioName(studioMatch[1])
      };
      console.log('🎯 Estudio detectado:', this.currentStudio);
    }

    // También detectar desde el título de la página o elementos DOM
    if (!this.currentStudio) {
      const titleElement = document.querySelector('h1, .studio-title');
      if (titleElement) {
        const titleText = titleElement.textContent.toLowerCase();
        if (titleText.includes('jade')) this.currentStudio = { id: 'jade', nombre: 'Estudio Jade' };
        else if (titleText.includes('zian')) this.currentStudio = { id: 'zian', nombre: 'Estudio Zian' };
        else if (titleText.includes('índigo') || titleText.includes('indigo')) this.currentStudio = { id: 'indigo', nombre: 'Estudio Índigo' };
        else if (titleText.includes('ámbar') || titleText.includes('ambar')) this.currentStudio = { id: 'ambar', nombre: 'Estudio Ámbar' };
      }
    }
  }

  getStudioName(id) {
    const nombres = {
      'jade': 'Estudio Jade',
      'zian': 'Estudio Zian', 
      'indigo': 'Estudio Índigo',
      'ambar': 'Estudio Ámbar'
    };
    return nombres[id] || `Estudio ${id}`;
  }

  // ===== CONFIGURAR BOTONES DE ESTUDIO =====
  setupStudioButtons() {
    // Buscar todos los botones que podrían ser de solicitud de estudio
    const studioButtons = document.querySelectorAll(`
      button[type="submit"],
      .btn[href*="solicita"],
      .btn[href*="reserva"],
      button:contains("Solicita tu"),
      a:contains("Solicita tu")
    `);

    studioButtons.forEach(button => {
      const buttonText = button.textContent || button.innerText;
      
      // Si el botón menciona un estudio específico
      if (buttonText.includes('Solicita tu') && 
         (buttonText.includes('Estudio') || buttonText.includes('ahora'))) {
        
        console.log('🔘 Configurando botón de estudio:', buttonText);
        
        // Si es un botón de formulario
        if (button.type === 'submit') {
          const form = button.closest('form');
          if (form) {
            this.setupStudioForm(form, button);
          }
        }
        // Si es un enlace que debería ser botón de formulario
        else if (button.tagName === 'A') {
          this.convertLinkToFormButton(button);
        }
      }
    });
  }

  // ===== CONFIGURAR FORMULARIO DE ESTUDIO =====
  setupStudioForm(form, button) {
    form.id = form.id || `studio-form-${this.currentStudio?.id || 'generic'}`;
    
    // Pre-llenar estudio si hay campo oculto o select
    this.preSelectStudio(form);
    
    // Configurar listener de envío
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleStudioFormSubmit(form, button);
    });

    console.log('✅ Formulario de estudio configurado:', form.id);
  }

  // ===== PRE-SELECCIONAR ESTUDIO ACTUAL =====
  preSelectStudio(form) {
    if (!this.currentStudio) return;

    // Buscar campo de estudio
    const estudioField = form.querySelector('select[name="estudio"], input[name="estudio"]');
    
    if (estudioField) {
      if (estudioField.type === 'select-one') {
        // Buscar opción que coincida
        const options = estudioField.querySelectorAll('option');
        options.forEach(option => {
          if (option.textContent.toLowerCase().includes(this.currentStudio.id) ||
              option.value.toLowerCase().includes(this.currentStudio.id)) {
            option.selected = true;
          }
        });
      } else {
        estudioField.value = this.currentStudio.nombre;
      }
    } else {
      // Crear campo oculto si no existe
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = 'estudio';
      hiddenField.value = this.currentStudio.nombre;
      form.appendChild(hiddenField);
    }

    // Pre-llenar mensaje de interés
    const expectativasField = form.querySelector('textarea[name="expectativas"], textarea[name="mensaje"]');
    if (expectativasField && !expectativasField.value.trim()) {
      expectativasField.value = `Estoy interesado en el ${this.currentStudio.nombre}. `;
      expectativasField.focus();
      // Poner cursor al final
      expectativasField.setSelectionRange(expectativasField.value.length, expectativasField.value.length);
    }
  }

  // ===== MANEJAR ENVÍO DEL FORMULARIO =====
  async handleStudioFormSubmit(form, button) {
    console.log('📤 Procesando solicitud de estudio:', this.currentStudio);

    // Cambiar estado del botón
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
      // Obtener datos del formulario
      const formData = new FormData(form);
      const formObject = {};
      
      for (let [key, value] of formData.entries()) {
        formObject[key] = value;
      }

      // Asegurar que el estudio esté incluido
      if (this.currentStudio && !formObject.estudio) {
        formObject.estudio = this.currentStudio.nombre;
      }

      console.log('📋 Datos del formulario:', formObject);

      // Enviar a sistema de formularios
      await this.sendStudioRequest(formObject, form);

      // Restaurar botón
      button.disabled = false;
      button.textContent = originalText;

    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error);
      
      // Restaurar botón
      button.disabled = false;
      button.textContent = originalText;
      
      // Mostrar error
      this.showError(form, 'Error al enviar. Intenta por WhatsApp directamente.');
    }
  }

  // ===== ENVIAR SOLICITUD DE ESTUDIO =====
  async sendStudioRequest(data, form) {
    // 1. Preparar mensaje para WhatsApp
    const whatsappMessage = this.buildStudioWhatsAppMessage(data);
    
    // 2. Enviar backup a Formspree
    try {
      await this.sendToFormspree(data);
    } catch (error) {
      console.warn('⚠️ Error en backup Formspree:', error);
    }

    // 3. Mostrar opciones al usuario
    this.showSendOptions(form, whatsappMessage);
  }

  // ===== CONSTRUIR MENSAJE DE WHATSAPP =====
  buildStudioWhatsAppMessage(data) {
    const estudioInfo = data.estudio ? ` - ${data.estudio}` : '';
    
    return `🏠 *CONSULTA PIXEL LIVING${estudioInfo}*

👤 *Información de contacto:*
• Nombre: ${data.nombre || 'No proporcionado'}
• Email: ${data.email || 'No proporcionado'}
• Teléfono: ${data.telefono || data.phone || 'No proporcionado'}

📅 *Detalles:*
• Estudio de interés: ${data.estudio || this.currentStudio?.nombre || 'No especificado'}
• Fecha aproximada: ${data.fecha || data.fecha_interes || 'Por definir'}
• Duración: ${data.estadia || data.duracion || 'Por definir'}
• Personas: ${data.personas || '1'}

💭 *Mensaje:*
${data.expectativas || data.mensaje || data.consulta || 'Sin mensaje adicional'}

---
Enviado desde: pixelliving.co 🌟
Página: ${window.location.pathname}`;
  }

  // ===== ENVIAR A FORMSPREE =====
  async sendToFormspree(data) {
    const formspreeUrl = this.config.formspree?.endpoints?.estudio || 
                        this.config.formspree?.endpoints?.reservas;
    
    if (!formspreeUrl) {
      throw new Error('No hay endpoint de Formspree configurado');
    }

    const response = await fetch(formspreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        tipo: 'consulta_estudio',
        timestamp: new Date().toISOString(),
        pagina: window.location.href
      })
    });

    if (!response.ok) {
      throw new Error(`Error Formspree: ${response.status}`);
    }

    console.log('✅ Backup enviado a Formspree');
  }

  // ===== MOSTRAR OPCIONES DE ENVÍO =====
  showSendOptions(form, whatsappMessage) {
    // Crear modal de opciones
    const modal = this.createSendModal(whatsappMessage);
    document.body.appendChild(modal);

    // Configurar eventos
    this.setupModalEvents(modal, form);
  }

  createSendModal(message) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          ✅ Información recibida
        </h3>
        <p class="text-gray-600 mb-6">
          ¿Cómo prefieres continuar con tu consulta?
        </p>

        <div class="space-y-3 mb-6">
          <button 
            id="send-whatsapp" 
            class="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors"
            data-message="${encodeURIComponent(message)}"
          >
            📱 WhatsApp (Respuesta inmediata)
          </button>

          <button 
            id="just-email" 
            class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors"
          >
            📧 Solo por email (te contactamos)
          </button>
        </div>

        <div class="text-center">
          <button id="close-modal" class="text-gray-500 hover:text-gray-700 text-sm underline">
            Cerrar
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  setupModalEvents(modal, form) {
    const whatsappBtn = modal.querySelector('#send-whatsapp');
    const emailBtn = modal.querySelector('#just-email');
    const closeBtn = modal.querySelector('#close-modal');

    whatsappBtn.addEventListener('click', () => {
      const message = whatsappBtn.getAttribute('data-message');
      const whatsappUrl = `https://wa.me/${this.config.whatsapp.number}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      this.handleSuccess(modal, form, 'whatsapp');
    });

    emailBtn.addEventListener('click', () => {
      this.handleSuccess(modal, form, 'email');
    });

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  handleSuccess(modal, form, method) {
    document.body.removeChild(modal);
    
    const messages = {
      whatsapp: '¡Perfecto! Te redirigimos a WhatsApp para atención personalizada. 📱',
      email: '¡Gracias! Te contactaremos pronto por email para coordinar una visita. 📧'
    };

    this.showSuccess(form, messages[method]);
    
    // Reset form después de un delay
    setTimeout(() => {
      form.reset();
      if (this.currentStudio) {
        this.preSelectStudio(form); // Re-preseleccionar estudio
      }
    }, 3000);
  }

  // ===== MOSTRAR MENSAJES =====
  showSuccess(form, message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
    successDiv.textContent = message;
    
    form.parentNode.insertBefore(successDiv, form);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 5000);
  }

  showError(form, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.innerHTML = `
      ${message}
      <br>
      <a href="https://wa.me/${this.config.whatsapp.number}" target="_blank" class="underline font-medium">
        📱 Ir a WhatsApp directamente
      </a>
    `;
    
    form.parentNode.insertBefore(errorDiv, form);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 8000);
  }

  // ===== CONVERTIR ENLACE A BOTÓN DE FORMULARIO =====
  convertLinkToFormButton(link) {
    // Si el enlace no lleva a un formulario real, crear uno dinámico
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this.showQuickForm();
    });
  }

  showQuickForm() {
    if (!this.currentStudio) return;

    const quickForm = document.createElement('div');
    quickForm.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    quickForm.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          ${this.currentStudio.nombre}
        </h3>
        <form id="quick-studio-form" class="space-y-4">
          <input type="hidden" name="estudio" value="${this.currentStudio.nombre}">
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input type="text" name="nombre" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input type="tel" name="telefono" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">¿Cuándo te interesa?</label>
            <input type="date" name="fecha_interes" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
            <textarea name="consulta" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" placeholder="Cuéntanos qué te interesa del ${this.currentStudio.nombre}..."></textarea>
          </div>
          
          <div class="flex gap-3">
            <button type="submit" class="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Enviar consulta
            </button>
            <button type="button" id="cancel-quick-form" class="px-4 py-2 text-gray-500 hover:text-gray-700">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(quickForm);

    // Configurar eventos
    const form = quickForm.querySelector('#quick-studio-form');
    const cancelBtn = quickForm.querySelector('#cancel-quick-form');

    this.setupStudioForm(form, form.querySelector('button[type="submit"]'));

    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(quickForm);
    });
  }

  // ===== CONFIGURAR LISTENERS DE FORMULARIO =====
  setupFormListeners() {
    // Escuchar el evento global de formulario validado
    document.addEventListener('pixelFormValidated', (e) => {
      const { formType, formObject, formElement } = e.detail;
      
      // Si es un formulario de estudio o tiene información de estudio
      if (formType === 'estudio' || formObject.estudio || this.currentStudio) {
        console.log('📋 Formulario de estudio procesado por sistema global');
        // El sistema global ya maneja el envío, solo agregamos info del estudio
        if (this.currentStudio && !formObject.estudio) {
          formObject.estudio = this.currentStudio.nombre;
        }
      }
    });
  }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.StudioFormHandler = new StudioFormHandler();
  });
} else {
  window.StudioFormHandler = new StudioFormHandler();
}

console.log('✅ StudioFormHandler cargado');