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