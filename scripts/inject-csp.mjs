// scripts/inject-csp.mjs
// Post-build: inyecta una CSP estricta (basada en hashes SHA-256 de los scripts
// inline de cada página) como <meta http-equiv="Content-Security-Policy"> dentro
// del HTML generado en dist/. Esto permite eliminar 'unsafe-inline' de script-src
// en un sitio 100% estático, sin necesidad de nonces (que requieren SSR).
//
// Se ejecuta automáticamente tras `astro build` (ver package.json) y reescribe
// los .html de dist/, que es exactamente lo que Vercel despliega.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';

// Directivas que NO dependen de hashes por página.
const STATIC_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://formsubmit.co https://api.ipgeolocation.io https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com",
  "frame-src https://www.google.com https://maps.google.com https://www.googletagmanager.com",
  "form-action 'self' https://formsubmit.co",
  'upgrade-insecure-requests',
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// Extrae el contenido de los <script> inline EJECUTABLES (sin src y que no sean
// bloques de datos como application/ld+json) y devuelve sus hashes 'sha256-...'.
function inlineScriptHashes(html) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const hashes = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue; // script externo -> cubierto por host/'self'
    if (/type\s*=\s*["']?(application\/(ld\+json|json)|text\/template)/i.test(attrs)) continue;
    const body = m[2];
    const hash = createHash('sha256').update(body, 'utf8').digest('base64');
    hashes.add(`'sha256-${hash}'`);
  }
  return [...hashes];
}

function buildCsp(hashes) {
  // Patrón "strict CSP" recomendado por Google/Lighthouse:
  //  - 'strict-dynamic' + hashes: confía en los scripts inline propios y en lo que
  //    ellos carguen (p. ej. GTM y las etiquetas que GTM inyecte) -> marketing flexible.
  //  - https: y 'unsafe-inline' son SOLO fallback para navegadores CSP1/2 antiguos;
  //    los navegadores modernos los IGNORAN cuando hay 'strict-dynamic'/hashes.
  const scriptSrc = [
    "script-src 'strict-dynamic'",
    ...hashes,
    'https:',
    "'unsafe-inline'",
  ].join(' ');
  return [scriptSrc, ...STATIC_DIRECTIVES].join('; ');
}

// Detecta <script src> de PRIMERA PARTE (mismo origen). Con 'strict-dynamic' los
// scripts externos insertados por el parser quedan bloqueados en navegadores
// modernos, así que avisamos si Astro genera alguno en el futuro.
function warnFirstPartyExternalScripts(html, file) {
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('/') || src.startsWith('./') || src.startsWith('_astro')) {
      console.warn(
        `⚠️  ${file}: <script src="${src}"> de primera parte detectado. ` +
          `Con 'strict-dynamic' podría bloquearse: conviértelo en inline (is:inline) o revisa la CSP.`
      );
    }
  }
}

function injectMeta(html, csp) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
  // Debe ir ANTES del primer <script> para gobernarlos todos.
  const idx = html.search(/<script\b/i);
  if (idx !== -1) return html.slice(0, idx) + meta + '\n\t\t' + html.slice(idx);
  return html.replace(/<\/head>/i, `${meta}\n</head>`);
}

const files = walk(DIST).filter((f) => f.endsWith('.html'));
let count = 0;
for (const file of files) {
  let html = readFileSync(file, 'utf8');
  if (/http-equiv=["']Content-Security-Policy/i.test(html)) continue; // ya inyectada
  warnFirstPartyExternalScripts(html, file);
  const csp = buildCsp(inlineScriptHashes(html));
  writeFileSync(file, injectMeta(html, csp), 'utf8');
  count++;
}
console.log(`✅ CSP inyectada en ${count} páginas HTML.`);
