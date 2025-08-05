// src/i18n/utils/translator.ts - ACTUALIZADO PARA CHINO
import es from '../locales/es.json';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

export type Language = 'es' | 'en' | 'zh';

interface TranslationStructure {
  [key: string]: any;
}

const translations: Record<Language, TranslationStructure> = {
  es,
  en,
  zh
};

let currentLanguage: Language = 'es';

/**
 * Función principal de traducción
 */
export function t(key: string, lang?: Language): string {
  const language = lang || currentLanguage;
  const translation = translations[language];
  
  if (!translation) {
    console.warn(`🔍 Idioma no encontrado: "${language}"`);
    return key;
  }
  
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`🔍 Clave no encontrada: "${key}" en idioma "${language}"`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Función de interpolación de variables
 */
export function tWithVars(key: string, variables: Record<string, string | number>, lang?: Language): string {
  let text = t(key, lang);
  
  // Reemplazar variables en formato {{variable}}
  Object.entries(variables).forEach(([varKey, varValue]) => {
    const regex = new RegExp(`{{${varKey}}}`, 'g');
    text = text.replace(regex, String(varValue));
  });
  
  return text;
}

/**
 * Obtiene todas las traducciones de una sección
 * Ejemplo: getSection('hero', 'es') → objeto completo de hero
 */
export function getSection(section: string, lang?: Language): Record<string, any> {
  const language = lang || currentLanguage;
  const translation = translations[language];
  
  if (translation && section in translation) {
    return translation[section as keyof typeof translation] as Record<string, any>;
  }
  
  console.warn(`🔍 Sección no encontrada: "${section}" en idioma "${language}"`);
  return {};
}

/**
 * Establece el idioma actual globalmente
 */
export function setCurrentLanguage(lang: Language): void {
  currentLanguage = lang;
}

/**
 * Obtiene el idioma actual
 */
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

/**
 * Verifica si una traducción existe
 */
export function hasTranslation(key: string, lang?: Language): boolean {
  const language = lang || currentLanguage;
  const translation = translations[language];
  
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return false;
    }
  }
  
  return typeof value === 'string';
}

/**
 * Obtiene siguiente idioma en rotación (para toggle de 3 idiomas)
 */
export function getNextLanguage(lang?: Language): Language {
  const language = lang || currentLanguage;
  
  switch (language) {
    case 'es': return 'en';
    case 'en': return 'zh';
    case 'zh': return 'es';
    default: return 'es';
  }
}

/**
 * Obtiene idioma opuesto (para toggle de 2 idiomas - mantener compatibilidad)
 */
export function getOppositeLanguage(lang?: Language): Language {
  const language = lang || currentLanguage;
  return language === 'es' ? 'en' : 'es';
}

/**
 * Helper para páginas de Astro - detecta idioma desde URL
 */
export function getLanguageFromUrl(pathname: string): Language {
  // Si la URL empieza con /zh, es chino
  if (pathname.startsWith('/zh')) {
    return 'zh';
  }
  // Si la URL empieza con /en, es inglés
  if (pathname.startsWith('/en')) {
    return 'en';
  }
  // Por defecto español
  return 'es';
}

/**
 * Helper para generar URLs localizadas
 */
export function localizeUrl(path: string, lang: Language): string {
  // Limpiar path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (lang === 'en') {
    return `/en${cleanPath}`;
  }
  
  if (lang === 'zh') {
    return `/zh${cleanPath}`;
  }
  
  // Español es el default, sin prefijo
  return cleanPath;
}

/**
 * Helper para obtener URLs alternas (hreflang) - Actualizado para 3 idiomas
 */
export function getAlternateUrls(currentPath: string): { es: string; en: string; zh: string } {
  // Remover prefijos de idioma del path si existen
  const basePath = currentPath.replace(/^\/(en|zh)/, '') || '/';
  
  return {
    es: basePath,
    en: `/en${basePath}`,
    zh: `/zh${basePath}`
  };
}

/**
 * Función especial para arrays JSON
 */
export function tArray(key: string, lang?: Language): string[] {
  const language = lang || currentLanguage;
  const translation = translations[language];
  
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`🔍 Array no encontrado: "${key}" en idioma "${language}"`);
      return [];
    }
  }
  
  return Array.isArray(value) ? value : [];
}

/**
 * Función para obtener datos completos de un estudio específico
 */
export function getStudioData(studioId: string, lang?: Language): any {
  const language = lang || currentLanguage;
  
  const translation = translations[language];
  
  if (!translation || !translation.estudios || !translation.estudios[studioId]) {
    console.warn(`🏠 Estudio "${studioId}" no encontrado en idioma "${language}"`);
    return null;
  }
  
  return translation.estudios[studioId];
}

/**
 * Helper para obtener nombre nativo del idioma
 */
export function getLanguageNativeName(lang: Language): string {
  switch (lang) {
    case 'es': return 'Español';
    case 'en': return 'English';
    case 'zh': return '中文';
    default: return 'Español';
  }
}

/**
 * Helper para obtener códigos de idioma ISO
 */
export function getLanguageCode(lang: Language): string {
  switch (lang) {
    case 'es': return 'es-ES';
    case 'en': return 'en-US';
    case 'zh': return 'zh-CN';
    default: return 'es-ES';
  }
}

/**
 * Helper para obtener dirección de texto (RTL/LTR)
 */
export function getTextDirection(lang: Language): 'ltr' | 'rtl' {
  // Todos los idiomas actuales usan LTR
  return 'ltr';
}

/**
 * Función para formatear números según el idioma
 */
export function formatNumber(number: number, lang?: Language): string {
  const language = lang || currentLanguage;
  
  switch (language) {
    case 'es':
      return number.toLocaleString('es-CO');
    case 'en':
      return number.toLocaleString('en-US');
    case 'zh':
      return number.toLocaleString('zh-CN');
    default:
      return number.toLocaleString();
  }
}