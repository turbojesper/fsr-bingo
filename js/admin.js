// Manager-Ansicht: Login, Phasen-Steuerung, Einstellungen, Teilnehmerliste
import { isConfigured, sb, rpc, fetchGameState, subscribeGameState } from './db.js';
import { loadTheme, applyTexts, t } from './theme.js';
import { PHASES } from './phases.js';

const $ = (id) => document.getElementById(id);
let listTimer = null;
let subscribed = false;
let currentPhase = null;

function view(name) {
  $('view-login').classList.toggle('hidden', name !== 'login');
  $('view-admin').classList.toggle('hidden', name !== 'admin');
}

function banner(text) {
  const b = $('banner');
  b.textContent = text || '';
  b.classList.toggle('hidden', !text);
}

// ---- Phasen-Buttons ----
function renderPhaseButtons() {
  const box = $('phase-buttons');
  if (!box.children.length) {
    for (const p of PHASES) {
      const b = document.createElement('button');
      b.dataset.phase = p;
      b.textContent = t(`phases.${p}.name`, p);
      b.addEventListener('click', async () => {
        $('phase-error').textContent = '';
        try {
          await rpc('admin_set_phase', { p_phase: p });
          setPhase(p);
        } catch (e) { $('phase-error').textContent = e.message; }
      });
      box.append(b);
    }
  }
  for (const b of box.children) {
    b.classList.toggle('active', b.dataset.phase === currentPhase);
    b.classList.toggle('secondary', b.dataset.phase !== currentPhase);
  }
}
function setPhase(p) { currentPhase = p; renderPhaseButtons(); }

// ---- Einstellungen ----
function fillSettings(s) {
  // Felder nicht überschreiben, während jemand tippt
  if (document.activeElement !== $('motto')) $('motto').value = s.motto || '';
  if (document.activeElement !== $('poll')) $('poll').value = Math.round(s.poll_interval_ms / 1000);
}

$('settings-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const msg = $('settings-msg');
  msg.className = 'error'; msg.textContent = '';
  try {
    const s = await fetchGameState();
    await rpc('admin_set_settings', {
      p_motto: $('motto').value,
      p_poll_interval_ms: Math.round(Number($('poll').value) * 1000),
      p_theme: s.theme,
    });
    msg.className = 'ok'; msg.textContent = t('admin.saved');
  } catch (e) { msg.textContent = e.message; }
});

// ---- Teilnehmerliste (alle 5 s, nicht per Realtime) ----
async function loadParticipants() {
  try {
    const rows = await rpc('admin_list_participants');
    const ul = $('plist');
    ul.replaceChildren(...rows.map((r) => {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'status-dot' + (r.online ? ' on' : '');
      li.append(dot, r.nickname);
      return li;
    }));
    $('count-all').textContent = rows.length;
    $('count-online').textContent = rows.filter((r) => r.online).length;
    $('plist-empty').classList.toggle('hidden', rows.length > 0);
    banner('');
  } catch (e) {
    banner(e.message);
  }
}

async function refreshState() {
  try {
    const s = await fetchGameState();
    setPhase(s.phase);
    fillSettings(s);
  } catch (e) { banner(t('offline')); }
}

// ---- Login / Logout ----
async function enterAdmin() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return view('login');

  const { data: adminRow } = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!adminRow) {
    await sb.auth.signOut();
    view('login');
    $('login-error').textContent = t('admin.notAdmin');
    return;
  }

  view('admin');
  await refreshState();
  await loadParticipants();
  clearInterval(listTimer);
  listTimer = setInterval(loadParticipants, 5000);
  if (!subscribed) {
    subscribed = true;
    subscribeGameState(refreshState, (st) => {
      if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') banner(t('offline'));
      if (st === 'SUBSCRIBED') refreshState();
    });
  }
}

$('login-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('login-error').textContent = '';
  const { error } = await sb.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value,
  });
  if (error) {
    $('login-error').textContent = 'Login fehlgeschlagen: ' + error.message;
    return;
  }
  $('password').value = '';
  await enterAdmin();
});

$('logout').addEventListener('click', async () => {
  clearInterval(listTimer);
  await sb.auth.signOut();
  view('login');
});

async function init() {
  try { await loadTheme(); } catch (e) { $('msg').textContent = e.message; return; }
  applyTexts();
  $('title').textContent = t('title');
  document.title = t('title') + ' Manager';
  if (!isConfigured) { $('msg').textContent = t('notConfigured'); return; }
  await enterAdmin();
}

init();
