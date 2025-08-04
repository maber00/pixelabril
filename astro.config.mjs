// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
    
  // 🌍 CONFIGURACIÓN I18N - ACTUALIZADA PARA 3 IDIOMAS
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en", "zh"], // ← AÑADIDO "zh"
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false
    }
  },
      
  // 🔧 CONFIGURACIÓN DE BUILD
  build: {
    inlineStylesheets: 'auto'
  },
    
  // 📁 CONFIGURACIÓN DE OUTPUT
  output: 'static',
    
  // ⚡ CONFIGURACIÓN DE SERVIDOR
  server: {
    port: 3000,
    host: true
  }
});