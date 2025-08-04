// src/middleware/language.ts - ACTUALIZADO PARA 3 IDIOMAS
import { defineMiddleware } from 'astro:middleware';
import { detectUserLanguage, saveLanguagePreference } from '../i18n/utils/geo';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;
  
  // No procesar archivos estáticos
  if (pathname.includes('.') || pathname.startsWith('/api/')) {
    return next();
  }
  
  // Detectar idioma actual desde URL - ACTUALIZADO PARA 3 IDIOMAS
  const isChinesePath = pathname.startsWith('/zh');
  const isEnglishPath = pathname.startsWith('/en');
  const currentLang = isChinesePath ? 'zh' : (isEnglishPath ? 'en' : 'es');
  
  // Verificar si es primera visita (no hay preferencia)
  const hasPreference = context.request.headers.get('cookie')?.includes('pixel_language_preference');
  
  // Solo hacer detección automática en primera visita a la homepage
  if (!hasPreference && pathname === '/') {
    try {
      const detectedLang = await detectUserLanguage();
      
      // Redirigir según idioma detectado
      if (detectedLang === 'en') {
        console.log('🌍 Redirigiendo a inglés por detección geográfica');
        return redirect('/en', 302);
      } else if (detectedLang === 'zh') {
        console.log('🌍 Redirigiendo a chino por detección geográfica');
        return redirect('/zh', 302);
      }
      // Si es 'es', no redirigir (es el default)
    } catch (error) {
      console.warn('⚠️ Error en detección automática:', error);
      // Continuar sin redirección si hay error
    }
  }
  
  // Establecer headers de idioma
  const response = await next();
  
  // Añadir headers para SEO y debugging - ACTUALIZADO
  response.headers.set('Content-Language', currentLang);
  response.headers.set('X-Detected-Language', currentLang);
  
  // Añadir headers adicionales para chino
  if (currentLang === 'zh') {
    response.headers.set('X-Language-Region', 'zh-CN');
  }
  
  return response;
});