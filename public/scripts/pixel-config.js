// public/scripts/pixel-config.js
/**
 * CONFIGURACIÓN CENTRALIZADA - PIXEL LIVING
 * ✅ ACTUALIZADA CON NÚMERO REAL: 3017872595
 */

window.PIXEL_CONFIG = {
  // ===== WHATSAPP =====
  whatsapp: {
    // ✅ NÚMERO REAL CONFIGURADO
    number: '573195895858',  // 👈 CORREGIDO: agregué código de país 57
    baseUrl: 'https://wa.me/',
    
    // Mensajes predeterminados por si no hay formulario
    defaultMessages: {
      general: '¡Hola! Me interesa Pixel Living. ¿Podrían darme más información?',
      reserva: '¡Hola! Me gustaría conocer la disponibilidad de apartaestudios en Pixel Living.',
      contacto: '¡Hola! Tengo una consulta sobre Pixel Living.'
    }
  },

  // ===== FORMSPREE =====
  formspree: {
    // ✅ CONFIGURADO CON ID REAL DE FORMSPREE
    endpoints: {
      reservas: 'https://formspree.io/f/xeokkypj',  // ✅ ID REAL configurado
      contacto: 'https://formspree.io/f/xeokkypj',  // ✅ Usando mismo ID por ahora
      estudio: 'https://formspree.io/f/xeokkypj'    // ✅ Usando mismo ID por ahora
    }
  },

  // ===== EMAILS DE BACKUP =====
  emails: {
    info: 'info@pixelliving.co',
    reservas: 'reservas@pixelliving.co',
    soporte: 'soporte@pixelliving.co'
  },

  // ===== CONFIGURACIÓN DE VALIDACIÓN =====
  validation: {
    // Timeouts en milisegundos
    debounceDelay: 300,
    submitTimeout: 10000,
    
    // Longitudes de campos
    minLengths: {
      nombre: 2,
      mensaje: 10,
      expectativas: 20
    },
    
    maxLengths: {
      nombre: 50,
      asunto: 100,
      mensaje: 500,
      expectativas: 500
    },
    
    // Mensajes personalizados
    messages: {
      required: 'Este campo es obligatorio',
      email: 'Ingresa un correo electrónico válido (ej: juan@gmail.com)',
      phone: 'Ingresa un teléfono válido de 10 dígitos (ej: 3001234567)',
      minLength: (min) => `Mínimo ${min} caracteres`,
      maxLength: (max) => `Máximo ${max} caracteres`,
      date: 'La fecha no puede ser anterior a hoy',
      select: 'Selecciona una opción'
    }
  },

  // ===== CONFIGURACIÓN DE UI =====
  ui: {
    // Duración de animaciones (ms)
    animations: {
      notification: 5000,
      modalTransition: 300,
      fieldTransition: 300
    },
    
    // Colores del sistema (sincronizado con CSS)
    colors: {
      yellow: '#FFCC33',
      orange: '#FF9933', 
      blue: '#004099',
      purple: '#9966CC',
      brown: '#009185',
      green: '#33CC66'
    },
    
    // Configuración de notificaciones
    notifications: {
      position: 'top-right',
      autoClose: true,
      duration: 5000
    }
  },

  // ===== CONFIGURACIÓN DE ANALYTICS =====
  analytics: {
    // 🔥 PENDIENTE: Configurar Google Analytics real
    googleAnalyticsId: 'GA_MEASUREMENT_ID',
    
    // Eventos que se trackean automáticamente
    trackEvents: {
      formStart: true,
      formComplete: true,
      formError: true,
      whatsappClick: true,
      emailClick: true
    }
  },

  // ===== CONFIGURACIÓN DE DEBUG =====
  debug: {
    // Activar logs detallados (solo en desarrollo)
    enableLogging: true, // 🔥 CAMBIAR a false en producción
    
    // Mostrar información de debugging en consola
    showValidationLogs: true, // 🔥 CAMBIAR a false en producción
    
    // Mostrar modal de test para formularios
    showTestButton: false // Solo para desarrollo
  },

  // ===== INFORMACIÓN DEL SITIO =====
  site: {
    name: 'Pixel Living',
    url: 'https://pixelliving.co',
    email: 'info@pixelliving.co',
    phone: '+57 319 5895858', // ✅ NÚMERO REAL CONFIGURADO
    address: 'Bogotá, Colombia',
    
    // Redes sociales
    social: {
      instagram: 'https://instagram.com/pixelliving.co',
      whatsapp: null // Se genera automáticamente
    }
  }
};

// ===== AUTO-CONFIGURACIÓN =====
(function() {
  // Generar URL de WhatsApp automáticamente
  window.PIXEL_CONFIG.site.social.whatsapp = 
    `${window.PIXEL_CONFIG.whatsapp.baseUrl}${window.PIXEL_CONFIG.whatsapp.number}`;

  // Configurar modo debug basado en hostname
  if (window.location.hostname === 'localhost' || 
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('.local')) {
    window.PIXEL_CONFIG.debug.enableLogging = true;
    window.PIXEL_CONFIG.debug.showValidationLogs = true;
  } else {
    // Producción - deshabilitar debug
    window.PIXEL_CONFIG.debug.enableLogging = false;
    window.PIXEL_CONFIG.debug.showValidationLogs = false;
    window.PIXEL_CONFIG.debug.showTestButton = false;
  }

  // Log de configuración cargada
  if (window.PIXEL_CONFIG.debug.enableLogging) {
    console.log('🔧 Configuración Pixel Living cargada:', {
      whatsapp: window.PIXEL_CONFIG.whatsapp.number,
      formspree: Object.keys(window.PIXEL_CONFIG.formspree.endpoints),
      debug: window.PIXEL_CONFIG.debug.enableLogging,
      environment: window.location.hostname
    });
  }
})();

// ===== HELPERS PARA ACCESO FÁCIL =====
window.getPixelConfig = function(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], window.PIXEL_CONFIG);
};

window.updatePixelConfig = function(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], window.PIXEL_CONFIG);
  target[lastKey] = value;
  
  if (window.PIXEL_CONFIG.debug.enableLogging) {
    console.log(`🔧 Configuración actualizada: ${path} = ${value}`);
  }
};

// ===== VALIDACIÓN DE CONFIGURACIÓN =====
window.validatePixelConfig = function() {
  const config = window.PIXEL_CONFIG;
  const issues = [];

  // Validar WhatsApp
  if (!config.whatsapp.number || config.whatsapp.number === '573001234567') {
    issues.push('⚠️ Número de WhatsApp no configurado o usando valor por defecto');
  }

  // Validar Formspree
  const endpoints = config.formspree.endpoints;
  Object.entries(endpoints).forEach(([key, url]) => {
    if (url.includes('YOUR_') || url.includes('mwpkqarl')) {
      issues.push(`⚠️ Endpoint de Formspree para '${key}' no configurado o usando valor por defecto`);
    }
  });

  // Validar Analytics
  if (config.analytics.googleAnalyticsId === 'GA_MEASUREMENT_ID') {
    issues.push('⚠️ Google Analytics ID no configurado');
  }

  if (issues.length > 0) {
    console.warn('🚨 Problemas de configuración encontrados:');
    issues.forEach(issue => console.warn(issue));
    
    if (config.debug.enableLogging) {
      console.log('📝 Para corregir:');
      console.log('1. Editar public/scripts/pixel-config.js');
      console.log('2. Cambiar los valores marcados con 🔥');
      console.log('3. Guardar y recargar la página');
    }
  } else {
    console.log('✅ Configuración completamente validada');
  }

  return issues.length === 0;
};

// ===== EJECUTAR VALIDACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', () => {
  if (window.PIXEL_CONFIG.debug.enableLogging) {
    console.log('🔍 Validando configuración...');
    window.validatePixelConfig();
  }
});

console.log('✅ Pixel Config cargado - WhatsApp: 573195895858');