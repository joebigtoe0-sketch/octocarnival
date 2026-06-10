// ── ScrapRats Audio Manager ───────────────────────────────────────────────────
// Singleton module — import and call anywhere without React context.

const STORAGE_KEY = 'scraprats_audio_v1';

const DEFAULTS = { musicVolume: 0.5, sfxVolume: 0.7, musicMuted: false, sfxMuted: false };

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; }
  catch { return { ...DEFAULTS }; }
}
function save(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

let _s = load();

// ── Subscribers (for React reactivity) ───────────────────────────────────────
const _listeners = new Set();
function _notify() { _listeners.forEach(fn => fn({ ..._s })); }

export function subscribeAudio(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
export function getAudioSettings() { return { ..._s }; }

// ── Music ─────────────────────────────────────────────────────────────────────
const MUSIC_TRACKS = [
  '/assets/music/Sewerrats.mp3',
  '/assets/music/Sewerrats2.mp3',
  '/assets/music/Scraprats.mp3',
  '/assets/music/Scraprats2.mp3',
];
let _musicEl      = null;
let _musicIdx     = 0;
let _musicStarted = false;

function _applyMusicVolume() {
  if (_musicEl) _musicEl.volume = _s.musicMuted ? 0 : _s.musicVolume;
}

function _nextTrack() {
  _musicIdx = (_musicIdx + 1) % MUSIC_TRACKS.length;
  _playTrack(_musicIdx);
}

function _playTrack(idx) {
  if (_musicEl) { _musicEl.onended = null; _musicEl.pause(); }
  _musicEl = new Audio(MUSIC_TRACKS[idx]);
  _musicEl.volume = _s.musicMuted ? 0 : _s.musicVolume;
  _musicEl.onended = _nextTrack;
  _musicEl.play().catch(() => {});
}

export function skipTrack() {
  _musicIdx = (_musicIdx + 1) % MUSIC_TRACKS.length;
  _playTrack(_musicIdx);
}

export function startMusic() {
  if (_musicStarted) return;
  _musicStarted = true;
  const attempt = () => { _playTrack(0); window.removeEventListener('pointerdown', attempt); };
  // Try immediately; if blocked by autoplay policy, wait for first user interaction
  const p = new Audio(MUSIC_TRACKS[0]);
  p.volume = 0;
  p.play().then(() => { p.pause(); _playTrack(0); }).catch(() => {
    window.addEventListener('pointerdown', attempt, { once: true });
  });
}

// ── SFX ───────────────────────────────────────────────────────────────────────
const SFX_URLS = {
  coins:       '/assets/soundeffects/Coinspending.wav',
  lootboxLoot: '/assets/soundeffects/LootboxLOOT.wav',
  npcClick:    '/assets/soundeffects/NPCclick.wav',
  uiClick:     '/assets/soundeffects/interfaceelementsclick.wav',
  crewLevel:   '/assets/soundeffects/Crewlevelupdate.wav',
  impact1:     '/assets/soundeffects/impact1.wav',
  impact2:     '/assets/soundeffects/impact2.wav',
  impact3:     '/assets/soundeffects/impact3.wav',
  impact4:     '/assets/soundeffects/impact4.wav',
  levelUp:     '/assets/soundeffects/Levelup.wav',
  sendBase:    '/assets/soundeffects/sendbase.wav',
  exp1:        '/assets/soundeffects/exp1.wav',
  exp2:        '/assets/soundeffects/exp2.wav',
  enemyPop:    '/assets/soundeffects/pop.mp3',
  gemCollect:  '/assets/soundeffects/gemcollect.wav',
  bell:        '/assets/soundeffects/bell.mp3',
};

// ── Looping SFX (wheelspin during lootbox roll) ───────────────────────────────
let _wheelspinEl = null;

export function startWheelspin() {
  if (_s.sfxMuted) return;
  stopWheelspin();
  _wheelspinEl = new Audio('/assets/soundeffects/wheelspin.mp3');
  _wheelspinEl.loop   = true;
  _wheelspinEl.volume = _s.sfxVolume;
  _wheelspinEl.play().catch(() => {});
}

export function stopWheelspin() {
  if (!_wheelspinEl) return;
  _wheelspinEl.pause();
  _wheelspinEl.currentTime = 0;
  _wheelspinEl = null;
}

// Per-sound gain multipliers — tune individual sounds relative to the master sfxVolume
const SFX_GAIN = {
  npcClick:    0.45,
  coins:       0.5,
  exp1:        0.6,
  exp2:        0.6,
  enemyPop:    1.3,
};

// Preload one instance per sound for fast first-play
const _preloaded = {};
Object.entries(SFX_URLS).forEach(([k, url]) => {
  const a = new Audio(url);
  a.preload = 'auto';
  _preloaded[k] = a;
});

export function playSound(name) {
  if (_s.sfxMuted) return;
  let key = name;
  if (name === 'impact') key = 'impact' + (Math.floor(Math.random() * 4) + 1);
  if (name === 'exp')    key = 'exp'    + (Math.floor(Math.random() * 2) + 1);
  if (!SFX_URLS[key]) return;
  const gain  = SFX_GAIN[key] ?? 1;
  const clone = new Audio(SFX_URLS[key]);
  clone.volume = Math.min(1, _s.sfxVolume * gain);
  clone.play().catch(() => {});
}

// ── Settings setters ──────────────────────────────────────────────────────────
export function setMusicVolume(v) {
  _s = { ..._s, musicVolume: v }; save(_s); _applyMusicVolume(); _notify();
}
export function setSfxVolume(v) {
  _s = { ..._s, sfxVolume: v }; save(_s); _notify();
}
export function setMusicMuted(b) {
  _s = { ..._s, musicMuted: b }; save(_s); _applyMusicVolume(); _notify();
}
export function setSfxMuted(b) {
  _s = { ..._s, sfxMuted: b }; save(_s); _notify();
}
