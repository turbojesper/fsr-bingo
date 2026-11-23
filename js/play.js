// Teilnehmer-Ansicht (Handy)
import { isConfigured, rpc } from './db.js';
import { loadTheme, applyTexts, t } from './theme.js';
import { DEFAULT_POLL_MS } from './config.js';

const TOKEN_KEY = 'bingo_device_token';
const $ = (id) => document.getElementById(id);

let pollMs = DEFAULT_POLL_MS;
let timer = null;
let polling = false;
let joined = false;

// Geräte-Token: bleibt im Browser, bindet das Gerät an den Teilnehmer
function getToken() {
  let tok = null;
  try { tok = localStorage.getItem(TOKEN_KEY); } catch { /* privater Modus */ }
  if (!tok) {
    tok = crypto.randomUUID();
    try { localStorage.setItem(TOKEN_KEY, tok); } catch { /* ohne Speicher: Token nur bis Reload */ }
  }
  return tok;
}
const token = getToken();

function showBanner(text) {
  const b = $('banner');
  b.textContent = text || '';
  b.classList.toggle('hidden', !text);
}

function showView(name) {
  $('view-join').classList.toggle('hidden', name !== 'join');
  $('view-game').classList.toggle('hidden', name !== 'game');
}

function render(s) {
  $('who').textContent = s.nickname;
  $('motto').textContent = s.motto || t('noMotto');
  $('phase').textContent = t(`phases.${s.phase}.name`, s.phase);
  $('hint').textContent = t(`phases.${s.phase}.hint`);
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const s = await rpc('poll_state', { p_token: token });
    joined = true;
    showBanner('');
    if (s.theme) await loadTheme(s.theme).then(() => applyTexts());
    pollMs = s.poll_interval_ms || DEFAULT_POLL_MS;
    showView('game');
    render(s);
  } catch (e) {
    if (e.code === 'P0002') {
      // Gerät ist (noch) nicht beigetreten
      joined = false;
      showView('join');
    } else {
      showBanner(t('offline'));
    }
  } finally {
    polling = false;
    schedule();
  }
}

function schedule() {
  clearTimeout(timer);
  if (document.hidden || !joined) return; // im Hintergrund nicht abfragen
  timer = setTimeout(poll, pollMs);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && joined) poll(); // beim Zurückkommen sofort aktualisieren
});
addEventListener('online', () => joined && poll());

$('join-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('join-error').textContent = '';
  const btn = ev.submitter || ev.target.querySelector('button');
  btn.disabled = true;
  try {
    await rpc('join_game', { p_token: token, p_nickname: $('nick').value });
    joined = true;
    await poll();
  } catch (e) {
    $('join-error').textContent = e.message;
  } finally {
    btn.disabled = false;
  }
});

async function init() {
  try {
    await loadTheme();
  } catch (e) {
    $('msg').textContent = e.message;
    return;
  }
  applyTexts();
  $('title').textContent = t('title');
  document.title = t('title');

  if (!isConfigured) {
    $('msg').textContent = t('notConfigured');
    return;
  }
  // Erst nachsehen, ob dieses Gerät schon beigetreten ist (Reload ohne Datenverlust)
  joined = true;
  await poll();
}

init();
