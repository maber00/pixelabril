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
  
  // ✅ DETECTAR BUCLES DE REDIRECCIÓN
  const redirectCountHeader = context.request.headers.get('x-redirect-count');
  const redirectCount = redirectCountHeader ? parseInt(redirectCountHeader) : 0;
  
  // ✅ PREVENIR BUCLES INFINITOS
  if (redirectCount > 2) {
    console.error('❌ Bucle de redirección detectado, enviando respuesta directa');
    return next();
  }
  
  // Solo hacer detección automática en primera visita a la homepage
  if (!hasPreference && pathname === '/') {
    try {
      const detectedLang = await detectUserLanguage();
      
      // ✅ CAMBIO CRÍTICO: Usar 301 en lugar de 302 para SEO
      if (detectedLang === 'en') {
        console.log('🌍 Redirigiendo a inglés por detección geográfica');
        const response = redirect('/en', 301);
        // ✅ AÑADIR HEADER PARA TRACKING DE REDIRECTS
        response.headers.set('x-redirect-count', String(redirectCount + 1));
        response.headers.set('x-redirect-reason', 'language-detection-en');
        return response;
      } else if (detectedLang === 'zh') {
        console.log('🌍 Redirigiendo a chino por detección geográfica');
        const response = redirect('/zh', 301);
        // ✅ AÑADIR HEADER PARA TRACKING DE REDIRECTS
        response.headers.set('x-redirect-count', String(redirectCount + 1));
        response.headers.set('x-redirect-reason', 'language-detection-zh');
        return response;
      }
      // Si es 'es', no redirigir (es el default)
      console.log('🌍 Idioma detectado: español (default), sin redirección');
    } catch (error) {
      console.warn('⚠️ Error en detección automática:', error);
      // Continuar sin redirección si hay error
    }
  }
  
  // ✅ VALIDAR RUTAS EXISTENTES ANTES DE PROCESAR
  const validLanguagePaths = ['/en', '/zh'];
  const isValidLanguagePath = validLanguagePaths.some(path => pathname.startsWith(path));
  
  if (isValidLanguagePath) {
    // Verificar que la ruta sin el prefijo de idioma existe
    const basePath = pathname.replace(/^\/(en|zh)/, '') || '/';
    console.log(`🔍 Validando ruta: ${pathname} → base: ${basePath}`);
  }
  
  // Establecer headers de idioma
  const response = await next();
  
  // ✅ MEJORAR HEADERS PARA SEO Y DEBUGGING
  response.headers.set('Content-Language', currentLang);
  response.headers.set('X-Detected-Language', currentLang);
  response.headers.set('X-Language-Path', pathname);
  response.headers.set('X-Base-Language', 'es');
  
  // Añadir headers adicionales para chino
  if (currentLang === 'zh') {
    response.headers.set('X-Language-Region', 'zh-CN');
    response.headers.set('X-Language-Script', 'Hans');
  }
  
  // ✅ AÑADIR HEADERS PARA INGLÉS
  if (currentLang === 'en') {
    response.headers.set('X-Language-Region', 'en-US');
  }
  
  // ✅ AÑADIR HEADERS PARA ESPAÑOL
  if (currentLang === 'es') {
    response.headers.set('X-Language-Region', 'es-CO');
  }
  
  // ✅ HEADER PARA DEBUGGING DE REDIRECCIONES
  response.headers.set('X-Redirect-Count', String(redirectCount));
  
  // ✅ CACHE HEADERS PARA PERFORMANCE
  if (pathname.startsWith('/en/') || pathname.startsWith('/zh/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
  }
  
  return response;
});