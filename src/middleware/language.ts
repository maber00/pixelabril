// src/middleware/language.ts - ACTUALIZADO PARA 3 IDIOMAS
import { defineMiddleware } from 'astro:middleware';
import { detectUserLanguage, saveLanguagePreference } from '../i18n/utils/geo';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;
  const pathname = url.pathname;
  
  if (pathname.includes('.') || pathname.startsWith('/api/')) {
    return next();
  }
  
  const isChinesePath = pathname.startsWith('/zh');
  const isEnglishPath = pathname.startsWith('/en');
  const currentLang = isChinesePath ? 'zh' : (isEnglishPath ? 'en' : 'es');
  
  const hasPreference = context.request.headers.get('cookie')?.includes('pixel_language_preference');
  
  const redirectCountHeader = context.request.headers.get('x-redirect-count');
  const redirectCount = redirectCountHeader ? parseInt(redirectCountHeader) : 0;
  
  if (redirectCount > 2) {
    console.error('❌ Bucle de redirección detectado, enviando respuesta directa');
    return next();
  }
  
  if (!hasPreference && pathname === '/') {
    try {
      const detectedLang = await detectUserLanguage();
      
      if (detectedLang === 'en') {
        const response = redirect('/en', 301);
        response.headers.set('x-redirect-count', String(redirectCount + 1));
        response.headers.set('x-redirect-reason', 'language-detection-en');
        return response;
      } else if (detectedLang === 'zh') {
        const response = redirect('/zh', 301);
        response.headers.set('x-redirect-count', String(redirectCount + 1));
        response.headers.set('x-redirect-reason', 'language-detection-zh');
        return response;
      }
      // Si es 'es', no redirigir (es el default)
    } catch (error) {
      console.warn('⚠️ Error en detección automática:', error);
      // Continuar sin redirección si hay error
    }
  }
  
  const validLanguagePaths = ['/en', '/zh'];
  const isValidLanguagePath = validLanguagePaths.some(path => pathname.startsWith(path));
  
  if (isValidLanguagePath) {
    const basePath = pathname.replace(/^\/(en|zh)/, '') || '/';
  }
  
  const response = await next();
  
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