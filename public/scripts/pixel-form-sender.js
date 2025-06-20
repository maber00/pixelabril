// public/scripts/pixel-form-sender.js
/**
 * PIXEL FORM SENDER
 * Sistema de envío real para formularios de Pixel Living
 * Maneja WhatsApp dinámico y integración con Formspree
 */

class PixelFormSender {
  constructor() {
    this.config = {
      whatsapp: {
        number: '573001234567', // CAMBIAR por el número real
        baseUrl: 'https://wa.me/'
      },
      formspree: {
        endpoints: {
          reservas: 'https://formspree.io/f/YOUR_RESERVAS_ID', // CAMBIAR por ID real
          contacto: 'https://formspree.io/f/YOUR_CONTACTO_ID', // CAMBIAR por ID real
          estudio: 'https://formspree.io/f/YOUR_ESTUDIO_ID'    // CAMBIAR por ID real
        }
      },
      backup: {
        email: 'info@pixelliving.co' // Email de backup
      }
    };

    this.init();
  }

  init() {
    console.log('📤 Inicializando PixelFormSender...');
    this.setupFormListeners();
  }

  // ===== LISTENERS PARA FORMULARIOS VALIDADOS =====
  setupFormListeners() {
    document.addEventListener('pixelFormValidated', (e) => {
      this.handleValidatedForm(e.detail);
    });
  }

  async handleValidatedForm(detail) {
    const { formType, formObject, formElement } = detail;
    
    console.log(`📩 Procesando formulario tipo: ${formType}`, formObject);

    // Iniciar timeout y sistema de errores
    const formId = formElement.id;
    
    // Configurar timeout específico
    if (window.PEM) {
      window.PEM.startSubmissionTimeout(formId);
    }

    try {
      // Decidir método de envío según el tipo
      switch (formType) {
        case 'reservas':
          await this.sendReservaForm(formObject, formElement);
          break;
        case 'contacto':
          await this.sendContactoForm(formObject, formElement);
          break;
        case 'estudio':
          await this.sendEstudioForm(formObject, formElement);
          break;
        default:
          await this.sendGenericForm(formObject, formElement);
      }
      
      // Notificar éxito
      this.handleSendSuccess(formElement, formType);
      
    } catch (error) {
      console.error('❌ Error al enviar formulario:', error);
      this.handleSendError(formElement, error);
    } finally {
      // Limpiar timeout
      if (window.PEM) {
        window.PEM.clearTimeout(formId);
      }
    }
  }

  // ===== MANEJO DE ÉXITO MEJORADO =====
  handleSendSuccess(formElement, formType) {
    const formId = formElement.id;
    
    // Detener sistema de carga
    if (window.PEM) {
      window.PEM.stopLoading(formId);
    }

    // Anuncio accesible
    if (window.PAM) {
      const formTypeLabel = this.getFormTypeLabel(formType);
      window.PAM.announceFormSubmission('success', formTypeLabel);
    }

    // Emitir evento de éxito
    document.dispatchEvent(new CustomEvent('pixelFormSuccess', {
      detail: { formId, formType, formElement }
    }));
  }

  getFormTypeLabel(formType) {
    const labels = {
      'reservas': 'solicitud de reserva',
      'contacto': 'mensaje de contacto',
      'estudio': 'consulta de estudio'
    };
    return labels[formType] || 'formulario';
  }

  // ===== ENVÍO DE FORMULARIO DE RESERVAS =====
  async sendReservaForm(data, formElement) {
    // 1. Preparar mensaje para WhatsApp
    const whatsappMessage = this.buildReservaWhatsAppMessage(data);
    
    // 2. Enviar a Formspree (backup)
    try {
      await this.sendToFormspree('reservas', data);
      console.log('✅ Enviado a Formspree como backup');
    } catch (error) {
      console.warn('⚠️ Error en Formspree backup:', error);
    }

    // 3. Mostrar opciones al usuario
    this.showSendOptions(formElement, whatsappMessage, 'reserva');
  }

  buildReservaWhatsAppMessage(data) {
    const estudioInfo = data.estudio ? ` para el ${data.estudio}` : '';
    
    return `🏠 *SOLICITUD DE RESERVA PIXEL LIVING*${estudioInfo}

👤 *Datos personales:*
• Nombre: ${data.nombre}
• Email: ${data.email}
• Teléfono: ${data.telefono}

📅 *Detalles de la estadía:*
• Fecha de ingreso: ${data.fecha || 'Por definir'}
• Duración estimada: ${data.estadia || 'Por definir'}
• Número de personas: ${data.personas || '1'}

💭 *Mensaje:*
${data.expectativas || 'Sin mensaje adicional'}

---
Enviado desde pixelliving.co 🌟`;
  }

  // ===== ENVÍO DE FORMULARIO DE CONTACTO =====
  async sendContactoForm(data, formElement) {
    const whatsappMessage = this.buildContactoWhatsAppMessage(data);
    
    try {
      await this.sendToFormspree('contacto', data);
      console.log('✅ Contacto enviado a Formspree');
    } catch (error) {
      console.warn('⚠️ Error en Formspree:', error);
    }

    this.showSendOptions(formElement, whatsappMessage, 'consulta');
  }

  buildContactoWhatsAppMessage(data) {
    return `📞 *CONSULTA PIXEL LIVING*

👤 *Contacto:*
• Nombre: ${data.nombre}
• Email: ${data.email}

📋 *Asunto:* ${data.asunto}

💬 *Mensaje:*
${data.mensaje}

---
Enviado desde pixelliving.co 🌟`;
  }

  // ===== ENVÍO DE FORMULARIO POR ESTUDIO =====
  async sendEstudioForm(data, formElement) {
    const whatsappMessage = this.buildEstudioWhatsAppMessage(data);
    
    try {
      await this.sendToFormspree('estudio', data);
      console.log('✅ Formulario de estudio enviado a Formspree');
    } catch (error) {
      console.warn('⚠️ Error en Formspree:', error);
    }

    this.showSendOptions(formElement, whatsappMessage, 'estudio específico');
  }

  buildEstudioWhatsAppMessage(data) {
    return `🏠 *CONSULTA ESTUDIO ESPECÍFICO - PIXEL LIVING*

🎯 *Estudio de interés:* ${data.estudio || 'No especificado'}

👤 *Datos personales:*
• Nombre: ${data.nombre}
• Email: ${data.email}
• Teléfono: ${data.telefono}

📅 *Detalles:*
• Fecha de ingreso: ${data.fecha || 'Por definir'}
• Duración: ${data.estadia || 'Por definir'}
• Personas: ${data.personas || '1'}

💭 *Mensaje:*
${data.expectativas || 'Sin mensaje adicional'}

---
Enviado desde pixelliving.co 🌟`;
  }

  // ===== INTEGRACIÓN CON FORMSPREE =====
  async sendToFormspree(formType, data) {
    const endpoint = this.config.formspree.endpoints[formType];
    
    if (!endpoint || endpoint.includes('YOUR_')) {
      throw new Error(`Endpoint de Formspree no configurado para: ${formType}`);
    }

    // Agregar datos de contexto
    const payload = {
      ...data,
      _subject: this.getFormspreeSubject(formType, data),
      _replyto: data.email,
      _language: 'es',
      _timezone: 'America/Bogota',
      _timestamp: new Date().toISOString(),
      _source: 'pixelliving.co'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Formspree error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  getFormspreeSubject(formType, data) {
    switch (formType) {
      case 'reservas':
        return `🏠 Nueva solicitud de reserva - ${data.nombre}`;
      case 'contacto':
        return `📞 Consulta: ${data.asunto} - ${data.nombre}`;
      case 'estudio':
        return `🎯 Interés en ${data.estudio} - ${data.nombre}`;
      default:
        return `📋 Nuevo mensaje desde Pixel Living - ${data.nombre}`;
    }
  }

  // ===== MOSTRAR OPCIONES DE ENVÍO =====
  showSendOptions(formElement, whatsappMessage, formTypeLabel) {
    // Ocultar formulario y mostrar opciones
    formElement.style.display = 'none';
    
    // Crear modal de opciones
    const modal = this.createSendOptionsModal(whatsappMessage, formTypeLabel);
    document.body.appendChild(modal);

    // Setup eventos
    this.setupModalEvents(modal, formElement);
  }

  createSendOptionsModal(whatsappMessage, formTypeLabel) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'send-options-modal';

    const whatsappUrl = this.buildWhatsAppUrl(whatsappMessage);

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">
            ¡Tu ${formTypeLabel} está lista! 🎉
          </h2>
          <p class="text-gray-600">
            Ya guardamos tu información. Elige cómo quieres completar el proceso:
          </p>
        </div>

        <div class="space-y-3 mb-6">
          <button 
            id="send-whatsapp" 
            class="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"/>
            </svg>
            Continúar por WhatsApp (Recomendado)
          </button>

          <button 
            id="just-email" 
            class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md flex items-center justify-center font-medium transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            Solo por email (te contactamos nosotros)
          </button>
        </div>

        <div class="text-center">
          <button id="close-modal" class="text-gray-500 hover:text-gray-700 text-sm underline">
            Volver al formulario
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  // ===== EVENTOS DEL MODAL =====
  setupModalEvents(modal, formElement) {
    const whatsappBtn = modal.querySelector('#send-whatsapp');
    const emailBtn = modal.querySelector('#just-email');
    const closeBtn = modal.querySelector('#close-modal');

    whatsappBtn.addEventListener('click', () => {
      const whatsappUrl = whatsappBtn.getAttribute('data-url') || 
                         this.buildWhatsAppUrl(modal.getAttribute('data-message'));
      window.open(whatsappUrl, '_blank');
      this.handleSuccessfulSend(modal, formElement, 'whatsapp');
    });

    emailBtn.addEventListener('click', () => {
      this.handleSuccessfulSend(modal, formElement, 'email');
    });

    closeBtn.addEventListener('click', () => {
      this.closeModal(modal, formElement);
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modal, formElement);
      }
    });

    // Almacenar URL y mensaje para el evento click
    const whatsappMessage = modal.getAttribute('data-message');
    if (whatsappMessage) {
      whatsappBtn.setAttribute('data-url', this.buildWhatsAppUrl(whatsappMessage));
    }
  }

  // ===== CONSTRUCCIÓN DE URL DE WHATSAPP =====
  buildWhatsAppUrl(message) {
    const encodedMessage = encodeURIComponent(message);
    return `${this.config.whatsapp.baseUrl}${this.config.whatsapp.number}?text=${encodedMessage}`;
  }

  // ===== MANEJO DE ÉXITO =====
  handleSuccessfulSend(modal, formElement, method) {
    this.closeModal(modal, formElement);
    
    const methodMessages = {
      whatsapp: '¡Perfecto! Te redirigimos a WhatsApp para completar tu solicitud. 📱',
      email: '¡Listo! Recibimos tu información y te contactaremos pronto por email. 📧'
    };

    // Mostrar notificación de éxito
    if (window.PVM) {
      window.PVM.showFormSuccess(formElement, methodMessages[method]);
    }

    // Reset formulario después de un delay
    setTimeout(() => {
      formElement.reset();
      formElement.style.display = 'block';
      
      // Limpiar todos los estados de validación
      const fields = formElement.querySelectorAll('.field-valid, .field-invalid');
      fields.forEach(field => {
        field.classList.remove('field-valid', 'field-invalid');
        field.classList.add('field-neutral');
      });
    }, 3000);
  }

  // ===== MANEJO DE ERRORES =====
  handleSendError(formElement, error) {
    console.error('❌ Error detallado:', error);
    
    let errorMessage = 'Error al procesar el formulario. ';
    
    if (error.message.includes('Formspree')) {
      errorMessage += 'Por favor intenta contactarnos directamente por WhatsApp.';
    } else if (error.message.includes('network')) {
      errorMessage += 'Revisa tu conexión a internet e intenta nuevamente.';
    } else {
      errorMessage += 'Intenta nuevamente o contáctanos por WhatsApp.';
    }

    if (window.PVM) {
      window.PVM.showFormError(formElement, errorMessage);
    }

    // Mostrar opción de WhatsApp como backup
    this.showWhatsAppBackup(formElement);
  }

  showWhatsAppBackup(formElement) {
    const backupContainer = document.createElement('div');
    backupContainer.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-md';
    backupContainer.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-green-800 font-medium">¿Problemas con el envío?</span>
      </div>
      <p class="text-green-700 mt-1 text-sm">
        Contáctanos directamente por WhatsApp y te ayudamos inmediatamente.
      </p>
      <a 
        href="${this.config.whatsapp.baseUrl}${this.config.whatsapp.number}" 
        target="_blank"
        class="inline-flex items-center mt-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"/>
        </svg>
        Ir a WhatsApp
      </a>
    `;

    formElement.parentNode.insertBefore(backupContainer, formElement.nextSibling);
    
    // Auto-remove después de 10 segundos
    setTimeout(() => {
      if (backupContainer.parentNode) {
        backupContainer.parentNode.removeChild(backupContainer);
      }
    }, 10000);
  }

  // ===== UTILIDADES =====
  closeModal(modal, formElement) {
    document.body.removeChild(modal);
    formElement.style.display = 'block';
  }

  // ===== FORMULARIO GENÉRICO =====
  async sendGenericForm(data, formElement) {
    const whatsappMessage = `📋 *CONSULTA PIXEL LIVING*

${Object.entries(data).map(([key, value]) => `• ${key}: ${value}`).join('\n')}

---
Enviado desde pixelliving.co 🌟`;

    this.showSendOptions(formElement, whatsappMessage, 'consulta');
  }

  // ===== API PÚBLICA =====
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig() {
    return this.config;
  }
}

// ===== INICIALIZACIÓN GLOBAL =====
window.PixelFormSender = PixelFormSender;

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.PFS = new PixelFormSender();
  });
} else {
  window.PFS = new PixelFormSender();
}

console.log('✅ PixelFormSender cargado y listo');