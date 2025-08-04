// src/i18n/utils/geo.ts
const LATAM_COUNTRIES = [
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 
  'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 
  'PE', 'PR', 'UY', 'VE', 'ES'
];

const CHINESE_COUNTRIES = [
  'CN', 'TW', 'HK', 'MO', 'SG'  
];

const STORAGE_KEY = 'pixel_language_preference';
const DETECTION_STORAGE_KEY = 'pixel_geo_detected';

export type Language = 'es' | 'en' | 'zh';


export async function detectUserLanguage(): Promise<Language> {
  const savedPreference = getSavedLanguagePreference();
  if (savedPreference) {
    console.log('🌍 Idioma desde preferencia guardada:', savedPreference);
    return savedPreference;
  }

  const todayDetection = getTodayDetection();
  if (todayDetection) {
    console.log('🌍 Idioma desde detección de hoy:', todayDetection);
    return todayDetection;
  }

  try {
    const country = await getLocationFromIP();
    
    const language = 
      country && LATAM_COUNTRIES.includes(country) ? 'es' :
      country && CHINESE_COUNTRIES.includes(country) ? 'zh' : 'en';
    
    saveTodayDetection(language, country);
    
    console.log('🌍 Idioma detectado por IP:', language, 'País:', country);
    return language;
  } catch (error) {
    console.warn('⚠️ Error en detección geográfica:', error);
    
    // 4. Fallback a navegador
    const browserLang = getBrowserLanguage();
    console.log('🌍 Idioma desde navegador:', browserLang);
    return browserLang;
  }
}

/**
 * Obtiene ubicación desde IP usando ipgeolocation.io
 */
async function getLocationFromIP(): Promise<string | null> {
  const API_KEY = 'f3ecdcf06ae7410e914dd9412783a45f'; // Reemplazar con tu API key
  
  try {
    // Crear AbortController para manejar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEY}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.country_code2 || null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Timeout en API ipgeolocation');
    } else {
      console.error('❌ Error API ipgeolocation:', error);
    }
    return null;
  }
}

/**
 * Detecta idioma del navegador como fallback
 */
function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'es';
  
  const lang = navigator.language || navigator.languages?.[0] || 'es';
  
  // Detectar chino mandarín
  if (lang.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  
  return lang.toLowerCase().startsWith('es') ? 'es' : 'en';
}

/**
 * Guarda preferencia de idioma del usuario
 */
export function saveLanguagePreference(lang: Language): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    console.log('💾 Preferencia de idioma guardada:', lang);
  } catch (error) {
    console.error('❌ Error guardando preferencia:', error);
  }
}

/**
 * Obtiene preferencia guardada
 */
export function getSavedLanguagePreference(): Language | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'es' || saved === 'en' || saved === 'zh' ? saved : null;
  } catch (error) {
    return null;
  }
}

/**
 * Guarda detección geográfica del día
 */
function saveTodayDetection(language: Language, country: string | null): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const detection = {
      language,
      country,
      date: new Date().toDateString()
    };
    localStorage.setItem(DETECTION_STORAGE_KEY, JSON.stringify(detection));
  } catch (error) {
    console.error('❌ Error guardando detección:', error);
  }
}

/**
 * Obtiene detección del día actual
 */
function getTodayDetection(): Language | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(DETECTION_STORAGE_KEY);
    if (!stored) return null;
    
    const detection = JSON.parse(stored);
    const today = new Date().toDateString();
    
    if (detection.date === today && (detection.language === 'es' || detection.language === 'en' || detection.language === 'zh')) {
      return detection.language;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Limpia datos de detección (para testing)
 */
export function clearLanguageData(): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DETECTION_STORAGE_KEY);
    console.log('🗑️ Datos de idioma limpiados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}