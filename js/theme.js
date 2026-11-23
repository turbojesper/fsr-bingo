// Theme laden: Farben als CSS-Variablen, Pixel-Font, Texte, Partikel.
// Alles Theme-Spezifische steht in themes/<name>/theme.json.
import { DEFAULT_THEME } from './config.js';
import { startParticles } from './particles.js';

let theme = null;
let basePath = '';

// Texte per Pfad holen, z. B. t('phases.lobby.name')
export function t(path, fallback = '') {
  const v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), theme?.texts);
  return v == null ? fallback : v;
}

export const getTheme = () => theme;

export async function loadTheme(name = DEFAULT_THEME) {
  if (theme && theme.name === name) return theme;
  basePath = `themes/${name}/`;
  const res = await fetch(`${basePath}theme.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Theme "${name}" nicht gefunden`);
  theme = await res.json();

  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(theme.colors)) {
    root.setProperty(`--c-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, v);
  }
  root.setProperty('--font-body', theme.fonts.body);
  root.setProperty('--font-pixel', `'${theme.fonts.pixel.family}', monospace`);

  // Pixel-Font registrieren
  try {
    const f = new FontFace(
      theme.fonts.pixel.family,
      `url(${basePath}${theme.fonts.pixel.file})`
    );
    document.fonts.add(await f.load());
  } catch (e) {
    console.warn('Pixel-Font konnte nicht geladen werden', e);
  }

  if (!document.querySelector('canvas.particles')) startParticles(theme.particles);
  return theme;
}

// Alle Elemente mit data-t="pfad" mit Theme-Text füllen
export function applyTexts(scope = document) {
  scope.querySelectorAll('[data-t]').forEach((el) => {
    el.textContent = t(el.dataset.t, el.textContent);
  });
  scope.querySelectorAll('[data-t-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.tPlaceholder, el.placeholder);
  });
}
