// Beamer-Ansicht: Realtime auf den Spielzustand + QR-Code zur Teilnehmer-Seite
import { isConfigured, fetchGameState, subscribeGameState } from './db.js';
import { loadTheme, applyTexts, t } from './theme.js';

const $ = (id) => document.getElementById(id);

// Teilnehmer-URL: gleiche Adresse wie diese Seite, nur index.html (lokal wie auf GitHub Pages korrekt)
const joinUrl = new URL('index.html', location.href).href.replace(/index\.html$/, '');

function drawQr() {
  const qr = qrcode(0, 'M'); // Typ 0 = Größe automatisch
  qr.addData(joinUrl);
  qr.make();
  $('qr').innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
  $('url').textContent = joinUrl;
}

function banner(text) {
  const b = $('banner');
  b.textContent = text || '';
  b.classList.toggle('hidden', !text);
}

async function refresh() {
  try {
    const s = await fetchGameState();
    await loadTheme(s.theme);
    applyTexts();
    $('title').textContent = t('title');
    document.title = t('title');
    $('motto').textContent = s.motto || t('noMotto');
    $('phase').textContent = t(`phases.${s.phase}.name`, s.phase);
    $('hint').textContent = t(`phases.${s.phase}.hint`);
    banner('');
  } catch (e) {
    console.warn(e);
    banner(t('offline'));
  }
}

async function init() {
  try { await loadTheme(); } catch (e) { $('msg').textContent = e.message; return; }
  applyTexts();
  $('title').textContent = t('title');
  drawQr();
  if (!isConfigured) { $('msg').textContent = t('notConfigured'); return; }

  await refresh();
  // Realtime: sofortige Updates. Bei Abbruch Banner zeigen, beim Wiederverbinden neu laden.
  subscribeGameState(refresh, (status) => {
    if (status === 'SUBSCRIBED') refresh();
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') banner(t('offline'));
  });
  // Sicherheitsnetz: alle 30 s neu laden, falls Realtime eine Nachricht verpasst
  setInterval(refresh, 30000);
}

init();
