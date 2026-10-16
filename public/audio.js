/* Spelling Land — synthesized sound effects, background music, and text-to-speech.
   Everything is generated with the Web Audio API, so there are no audio files to load. */

const Sound = {
  ctx: null,
  sfxOn: true,
  musicOn: true,
  _musicTimer: null,
  _ducked: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.8;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);
  },

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    if (this.musicOn) this.startMusic();
  },

  now() { return this.ctx ? this.ctx.currentTime : 0; },

  tone(freq, dur, opt = {}) {
    if (!this.ctx || !this.sfxOn && !opt.music) return;
    const { type = "sine", vol = 0.25, when = 0, attack = 0.005, slideTo = null, bus = null } = opt;
    const t = this.now() + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },

  // xylophone-ish: fundamental + bright overtone
  mallet(freq, when = 0, vol = 0.22, bus = null) {
    this.tone(freq, 0.45, { type: "sine", vol, when, bus, music: !!bus });
    this.tone(freq * 4, 0.12, { type: "sine", vol: vol * 0.25, when, bus, music: !!bus });
  },

  noise(dur = 0.15, vol = 0.3, freq = 1800, when = 0) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.now() + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t);
  },

  // C major pentatonic, so each correct letter climbs a happy scale
  SCALE: [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0, 2349.32, 2637.02],

  click() { this.tone(660, 0.07, { type: "triangle", vol: 0.15, slideTo: 880 }); },
  letter(i) { this.mallet(this.SCALE[i % this.SCALE.length]); },
  wrong() {
    this.tone(196, 0.16, { type: "square", vol: 0.06 });
    this.tone(155, 0.2, { type: "square", vol: 0.05, when: 0.07 });
  },
  uhoh() {
    this.tone(440, 0.2, { type: "triangle", vol: 0.18, slideTo: 392 });
    this.tone(349, 0.35, { type: "triangle", vol: 0.18, when: 0.2, slideTo: 294 });
  },
  word() {
    [0, 2, 4, 5].forEach((n, i) => this.mallet(this.SCALE[n], i * 0.07, 0.2));
  },
  bigWin() {
    [0, 2, 4, 5, 7, 9].forEach((n, i) => this.mallet(this.SCALE[n], i * 0.06, 0.18));
    this.tone(1046.5, 0.6, { type: "triangle", vol: 0.08, when: 0.36 });
  },
  star(i = 0) {
    const base = [1046.5, 1318.51, 1567.98][i % 3];
    this.tone(base, 0.35, { type: "triangle", vol: 0.2 });
    this.tone(base * 1.5, 0.3, { type: "sine", vol: 0.12, when: 0.06 });
    this.tone(base * 2, 0.25, { type: "sine", vol: 0.08, when: 0.12 });
  },
  fanfare() {
    const n = [523.25, 659.25, 783.99, 1046.5];
    n.forEach((f, i) => this.tone(f, 0.22, { type: "square", vol: 0.06, when: i * 0.12 }));
    this.tone(1046.5, 0.8, { type: "square", vol: 0.06, when: 0.5 });
    this.tone(1318.51, 0.8, { type: "triangle", vol: 0.1, when: 0.5 });
  },
  pop() {
    this.noise(0.12, 0.6, 2200);
    this.tone(900, 0.1, { type: "sine", vol: 0.15, slideTo: 300 });
  },
  whoosh() { this.noise(0.5, 0.25, 700); this.tone(500, 0.5, { type: "sine", vol: 0.08, slideTo: 1200 }); },
  badge() {
    [0, 4, 7, 9, 12].forEach((n, i) => this.mallet(this.SCALE[Math.min(n, 12)], i * 0.09, 0.2));
  },
  unlock() { this.tone(523.25, 0.12, { type: "triangle", vol: 0.15 }); this.tone(1046.5, 0.3, { type: "triangle", vol: 0.15, when: 0.1 }); },

  /* --- background music: a gentle looping marimba tune (I–vi–IV–V) --- */
  startMusic() {
    if (!this.ctx || this._musicTimer) return;
    this.musicBus.gain.cancelScheduledValues(this.now());
    this.musicBus.gain.setTargetAtTime(this._ducked ? 0.02 : 0.11, this.now(), 0.5);
    const bpm = 104, eighth = 60 / bpm / 2;
    const chords = [
      [261.63, 329.63, 392.0], // C
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63], // F
      [196.0, 246.94, 293.66], // G
    ];
    const pattern = [0, 1, 2, 1, 2, 1, 0, 2];
    const melody = [ // scale-degree offsets over the 4 bars (null = rest)
      [4, null, 5, 4, 2, null, 0, null],
      [2, null, 4, 2, 0, null, null, null],
      [5, null, 4, 5, 7, null, 5, null],
      [4, null, 2, 1, 2, null, null, null],
    ];
    let step = 0;
    let next = this.now() + 0.1;
    const tick = () => {
      while (next < this.now() + 0.25) {
        const bar = Math.floor(step / 8) % 4, s = step % 8;
        const ch = chords[bar];
        this.mallet(ch[pattern[s]], next - this.now(), 0.18, this.musicBus);
        if (s === 0 || s === 4) this.tone(ch[0] / 2, 0.5, { type: "triangle", vol: 0.25, when: next - this.now(), bus: this.musicBus, music: true });
        const m = melody[bar][s];
        if (m !== null && Math.floor(step / 32) % 2 === 1) this.mallet(this.SCALE[m], next - this.now(), 0.12, this.musicBus);
        step++;
        next += eighth;
      }
    };
    this._musicTimer = setInterval(tick, 60);
    tick();
  },
  stopMusic() {
    if (this._musicTimer) clearInterval(this._musicTimer);
    this._musicTimer = null;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(0, this.now(), 0.2);
  },
  duck(on) {
    this._ducked = on;
    if (!this.ctx || !this._musicTimer) return;
    this.musicBus.gain.setTargetAtTime(on ? 0.02 : 0.11, this.now(), 0.15);
  },
};

/* ---------- Voice ----------
   Every word, sentence, rule and phrase is pre-recorded with a neural voice (tools/build_audio.py)
   and listed in audio/manifest.js. Anything without a clip falls back to the browser's speech. */

// FNV-1a over UTF-16 code units — must match tools/collect_texts.js
function clipId(text, slow) {
  const s = String(text).trim() + (slow ? "|slow" : "");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
const sleepMs = ms => new Promise(r => setTimeout(r, ms));

const Voice = {
  rate: 0.85,         // settings slider; 0.85 = normal speed
  voiceName: "",      // "" = the recorded Spelling Land voice; otherwise a browser voice name
  voice: null,
  supported: "speechSynthesis" in window,
  clips: new Set(((window.AUDIO_CLIPS || {}).ids || "").split(" ").filter(Boolean)),
  base: "audio/" + ((window.AUDIO_CLIPS || {}).voice || "af_heart") + "/",
  // other recorded voices, e.g. af_sky for "Read it to me": { voice: Set(ids) }
  extra: Object.fromEntries(Object.entries((window.AUDIO_CLIPS || {}).voices || {}).map(([v, ids]) => [v, new Set(ids.split(" ").filter(Boolean))])),
  el: null,
  _token: 0,
  _fin: null,
  _fetched: new Set(),

  get recorded() { return !this.voiceName && this.clips.size > 0; },
  // a clip in the requested voice if recorded, else the main voice, else null (browser speech)
  url(text, slow, voice) {
    const id = clipId(text, slow);
    if (voice && this.extra[voice] && this.extra[voice].has(id)) return "audio/" + voice + "/" + id + ".mp3";
    return this.clips.has(id) ? this.base + id + ".mp3" : null;
  },

  PREFERRED: ["Samantha", "Google US English", "Microsoft Aria Online", "Microsoft Jenny Online", "Microsoft Ana Online",
    "Ava", "Allison", "Susan", "Karen", "Microsoft Zira", "Google UK English Female", "Daniel", "Moira"],

  list() {
    if (!this.supported) return [];
    return speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
  },
  pick() {
    const vs = this.list();
    if (!vs.length) return null;
    if (this.voiceName) {
      const v = vs.find(v => v.name === this.voiceName);
      if (v) return (this.voice = v);
    }
    for (const name of this.PREFERRED) {
      const v = vs.find(v => v.name.startsWith(name));
      if (v) return (this.voice = v);
    }
    return (this.voice = vs.find(v => /en-US/i.test(v.lang)) || vs[0]);
  },

  audioEl() {
    if (!this.el) { this.el = new Audio(); this.el.preload = "auto"; }
    return this.el;
  },
  // iPhone/iPad only let a media element play after it has played once inside a tap
  unlock() {
    if (this._unlocked || !this.recorded) return;
    this._unlocked = true;
    const el = this.audioEl();
    if (el.src && !el.paused) return;
    const first = this.clips.values().next().value;
    const src = this.base + first + ".mp3";
    el.muted = true;
    el.src = src;
    const p = el.play();
    if (p) p.then(() => { if (el.src.endsWith(src)) el.pause(); el.muted = false; }).catch(() => { el.muted = false; this._unlocked = false; });
  },

  stop() {
    this._token++;
    if (this.el) this.el.pause();
    if (this._fin) this._fin(true);
    if (this.supported) speechSynthesis.cancel();
    Sound.duck(false);
  },

  // Speak phrases in order. Each part is a string or {text, slow, rate (relative, 1 = normal), pause}.
  // opt.voice picks another recorded voice (falls back to the main one per line).
  // Resolves when finished or interrupted.
  async say(parts, opt = {}) {
    if (!Array.isArray(parts)) parts = [parts];
    this.stop();
    const token = this._token;
    Sound.duck(true);
    await sleepMs(40);
    for (const raw of parts) {
      if (token !== this._token) return;
      const p = typeof raw === "string" ? { text: raw } : raw;
      if (!p.text) continue;
      const slow = !!(p.slow || opt.slow);
      let ok = false;
      if (this.recorded) {
        const slowUrl = slow && this.url(p.text, true, opt.voice);
        const url = slowUrl || this.url(p.text, false, opt.voice);
        const rel = (p.rate || 1) * (slow && !slowUrl ? 0.8 : 1);
        if (url) ok = await this._play(url, token, rel);
      }
      if (!ok && token === this._token) await this._speak(p.text, token, (p.rate || 1) * (slow ? 0.65 : 1));
      if (token !== this._token) return;
      await sleepMs(p.pause !== undefined ? p.pause : 220);
    }
    if (token === this._token) Sound.duck(false);
  },

  _play(url, token, rel) {
    return new Promise(resolve => {
      if (token !== this._token) return resolve(true);
      const el = this.audioEl();
      let done = false, timer;
      const fin = ok => { if (done) return; done = true; clearTimeout(timer); el.onended = el.onerror = null; if (this._fin === fin) this._fin = null; resolve(ok); };
      this._fin = fin;
      el.onended = () => fin(true);
      el.onerror = () => fin(false);
      el.muted = false;
      el.src = url;
      const r = Math.max(0.5, Math.min(1.6, (this.rate / 0.85) * rel));
      el.preservesPitch = el.mozPreservesPitch = el.webkitPreservesPitch = true;
      el.defaultPlaybackRate = r;
      el.playbackRate = r;
      timer = setTimeout(() => fin(true), 20000);
      const pr = el.play();
      if (pr) pr.catch(() => fin(false));
    });
  },

  _speak(text, token, rel) {
    if (!this.supported) return Promise.resolve();
    if (!this.voice) this.pick();
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text.replace(/\/([a-z]{1,3})\//g, "$1"));  // "/b/" -> "b"
      if (this.voice) u.voice = this.voice;
      u.lang = (this.voice && this.voice.lang) || "en-US";
      u.rate = this.rate * rel;
      u.pitch = 1.05;
      let done = false;
      const fin = () => { if (done) return; done = true; if (this._fin === fin) this._fin = null; resolve(); };
      this._fin = fin;
      u.onend = fin;
      u.onerror = fin;
      setTimeout(fin, 1500 + text.length * 140 / u.rate);  // some browsers never fire onend
      speechSynthesis.speak(u);
    });
  },

  // warm the HTTP cache for lines that are about to be spoken
  prefetch(parts) {
    if (!this.recorded) return;
    for (const raw of parts) {
      const p = typeof raw === "string" ? { text: raw } : raw;
      const url = this.url(p.text, !!p.slow);
      if (url && !this._fetched.has(url)) { this._fetched.add(url); fetch(url).catch(() => this._fetched.delete(url)); }
    }
  },

  // "rain" -> R, A, I, N as separate recorded letter names
  letters(word) {
    return word.split("").map(ch => ({ text: ch === "'" ? window.SPOKEN.apostrophe : ch.toUpperCase(), pause: 110 }));
  },
};

if (Voice.supported) {
  speechSynthesis.onvoiceschanged = () => { Voice.voice = null; Voice.pick(); };
}
