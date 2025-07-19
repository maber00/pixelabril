import type { Language } from './geo';

// Tasa de cambio base (actualizar según necesidad)
const BASE_EXCHANGE_RATE = 4400; // 1 USD = 4400 COP (aproximado)

export interface PriceData {
  cop: number;
  usd: number;
  formatted: {
    cop: string;
    usd: string;
  };
}

/**
 * Convierte precio de COP a USD
 */
export function copToUsd(copAmount: number): number {
  return Math.round(copAmount / BASE_EXCHANGE_RATE);
}

/**
 * Convierte precio de USD a COP
 */
export function usdToCop(usdAmount: number): number {
  return Math.round(usdAmount * BASE_EXCHANGE_RATE);
}

/**
 * Formatea precio según el idioma/región
 */
export function formatPrice(amount: number, currency: 'COP' | 'USD', lang: Language): string {
  if (currency === 'COP') {
    // Formato colombiano: $2.650.000
    return `$${amount.toLocaleString('es-CO')}`;
  } else {
    // Formato internacional: $600 USD
    return `$${amount.toLocaleString('en-US')} USD`;
  }
}

/**
 * Obtiene precio formateado según idioma
 */
export function getLocalizedPrice(copPrice: number, lang: Language): string {
  if (lang === 'es') {
    return formatPrice(copPrice, 'COP', lang);
  } else {
    const usdPrice = copToUsd(copPrice);
    return formatPrice(usdPrice, 'USD', lang);
  }
}

/**
 * Genera objeto completo de precios
 */
export function generatePriceData(copPrice: number): PriceData {
  const usdPrice = copToUsd(copPrice);
  
  return {
    cop: copPrice,
    usd: usdPrice,
    formatted: {
      cop: formatPrice(copPrice, 'COP', 'es'),
      usd: formatPrice(usdPrice, 'USD', 'en')
    }
  };
}

/**
 * Precios específicos de Pixel Living
 */
export const PIXEL_PRICES = {
  jade: {
    cop: 2650000,
    usd: copToUsd(2650000)
  },
  zian: {
    cop: 2850000, 
    usd: copToUsd(2850000)
  },
  indigo: {
    cop: 2950000,
    usd: copToUsd(2950000)
  },
  ambar: {
    cop: 3100000,
    usd: copToUsd(3100000)
  }
};

/**
 * Obtiene precio de apartaestudio específico
 */
export function getStudioPrice(studioId: string, lang: Language): string {
  const studio = PIXEL_PRICES[studioId as keyof typeof PIXEL_PRICES];
  
  if (!studio) {
    console.warn(`❌ Apartaestudio no encontrado: ${studioId}`);
    return lang === 'es' ? 'Precio no disponible' : 'Price not available';
  }
  
  return getLocalizedPrice(studio.cop, lang);
}

/**
 * Datos para tabla comparativa vs arriendo tradicional
 */
export function getComparisonData(lang: Language) {
  const pixelPrice = lang === 'es' ? 2650000 : copToUsd(2650000);
  const traditionalRent = lang === 'es' ? 1800000 : copToUsd(1800000);
  const utilities = lang === 'es' ? 350000 : copToUsd(350000);
  const internet = lang === 'es' ? 80000 : copToUsd(80000);
  const cleaning = lang === 'es' ? 120000 : copToUsd(120000);
  
  const traditionalTotal = traditionalRent + utilities + internet + cleaning;
  const savings = traditionalTotal - pixelPrice;
  
  const currency = lang === 'es' ? 'COP' : 'USD';
  
  return {
    pixel: formatPrice(pixelPrice, currency, lang),
    traditional: {
      rent: formatPrice(traditionalRent, currency, lang),
      utilities: formatPrice(utilities, currency, lang),
      internet: formatPrice(internet, currency, lang),
      cleaning: formatPrice(cleaning, currency, lang),
      total: formatPrice(traditionalTotal, currency, lang)
    },
    savings: formatPrice(Math.abs(savings), currency, lang),
    isPixelCheaper: savings > 0
  };
}

/**
 * Actualiza tasa de cambio (para uso futuro con API)
 */
export function updateExchangeRate(newRate: number): void {
  // En una implementación real, esto podría actualizar desde una API
  console.log('💱 Nueva tasa de cambio:', newRate);
}