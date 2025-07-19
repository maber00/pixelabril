import { defineMiddleware } from 'astro:middleware';
import { detectUserLanguage, saveLanguagePreference } from '../i18n/utils/geo';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;
  
  // No procesar archivos estáticos
  if (pathname.includes('.') || pathname.startsWith('/api/')) {
    return next();
  }
  
  // Detectar idioma actual desde URL
  const isEnglishPath = pathname.startsWith('/en');
  const currentLang = isEnglishPath ? 'en' : 'es';
  
  // Verificar si es primera visita (no hay preferencia)
  const hasPreference = context.request.headers.get('cookie')?.includes('pixel_language_preference');
  
  // Solo hacer detección automática en primera visita a la homepage
  if (!hasPreference && pathname === '/') {
    try {
      const detectedLang = await detectUserLanguage();
      
      // Solo redirigir si se detectó inglés y no está ya en /en
      if (detectedLang === 'en') {
        console.log('🌍 Redirigiendo a inglés por detección geográfica');
        return redirect('/en', 302);
      }
    } catch (error) {
      console.warn('⚠️ Error en detección automática:', error);
      // Continuar sin redirección si hay error
    }
  }
  
  // Establecer headers de idioma
  const response = await next();
  
  // Añadir headers para SEO y debugging
  response.headers.set('Content-Language', currentLang);
  response.headers.set('X-Detected-Language', currentLang);
  
  return response;
});