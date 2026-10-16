/* Spelling Land — main app: players, worlds, lessons, five mini-games, stars & badges. */

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
const starsHTML = (n, max = 3) => Array.from({ length: max }, (_, i) => `<span class="star ${i < n ? "" : "off"}">★</span>`).join("");

/* ---------------- content ---------------- */
const GRADES = ["tk", "k", "2", "3", "4", "5", "gre"].filter(g => window.SPELLING_DATA[g]);
const DATA = window.SPELLING_DATA;
const WORLD = {
  tk: { color: "#FF8A3D", c2: "#FFB45C", light: "#FFF1E3", emoji: "🧸" },
  k: { color: "#FF4F7B", c2: "#FF8FA8", light: "#FFEAF0", emoji: "🌈" },
  2: { color: "#C86BFA", c2: "#FF8FD8", light: "#F7EAFF", emoji: "🍭" },
  3: { color: "#3D8BFF", c2: "#5FD0FF", light: "#E4F4FF", emoji: "🐠" },
  4: { color: "#22B07D", c2: "#6BE3A4", light: "#E3F8EE", emoji: "🐯" },
  5: { color: "#5B4BDB", c2: "#9C8CFF", light: "#ECE9FF", emoji: "🚀" },
  gre: { color: "#2E3A87", c2: "#5C6BC0", light: "#E7EAF8", emoji: "🎓" },
};
const TILE_COLORS = ["#FF5C8A", "#FF9A3D", "#FFC83D", "#2EC27E", "#4DB6FF", "#7B5CFF", "#FF8FB1", "#39C5BB"];

const GAMES = [
  { id: "learn", name: "Look & Learn", icon: "📖", color: "#48D4AE", desc: "See it, hear it, type it — then type it again from memory." },
  { id: "gap", name: "Fill the Gap", icon: "🧩", color: "#3797FF", desc: "Type the missing letters that make the pattern." },
  { id: "scramble", name: "Word Scramble", icon: "🔀", color: "#C59AFF", desc: "Unscramble the mixed-up letters." },
  { id: "balloon", name: "Balloon Pop", icon: "🎈", color: "#FF8A80", desc: "Remember the word and spell it before the balloon floats away!" },
  // GRE Verbal question types (multiple choice)
  { id: "match", name: "Meaning Match", icon: "🎯", color: "#3797FF", desc: "Read a definition and pick the word it defines." },
  { id: "tc", name: "Text Completion", icon: "📝", color: "#C59AFF", desc: "Real GRE format: fill one or two blanks so the passage makes sense." },
  { id: "se", name: "Sentence Equivalence", icon: "⚖️", color: "#FF8A80", desc: "Real GRE format: pick the TWO words that complete the sentence with the same meaning." },
  { id: "test", name: "Spelling Bee", icon: "🐝", color: "#FF3D7A", desc: "Listen and spell. Get half right to unlock the next lesson!" },
];
const GAME = Object.fromEntries(GAMES.map(g => [g.id, g]));
const KID_GAMES = ["learn", "gap", "scramble", "balloon", "test"];
const MC = new Set(["match", "tc", "se"]);
// per-level wording, e.g. the GRE "test" is recall from meaning, not a listening spelling bee
const GAME_OVERRIDE = {
  gre: {
    learn: { name: "Study Cards", icon: "🗂️", desc: "Definition, synonyms, antonyms, root and a GRE sentence — type each word, then again from memory." },
    test: { name: "Word Recall", icon: "🧠", desc: "Read the definition and sentence, then type the word from memory. Get half right to unlock the next lesson." },
  },
};
const gameInfo = (id, g) => ({ ...GAME[id], ...((GAME_OVERRIDE[g] || {})[id] || {}) });
GAME.tricky = { id: "tricky", name: "Tricky Words", icon: "🧠", color: "#FF9933" };
GAME.review = { id: "review", name: "Review Mix", icon: "🎲", color: "#3797FF" };

function parseWord(raw, extra = {}) {
  const letters = [], focus = [];
  let inB = false;
  for (const ch of raw) {
    if (ch === "[") inB = true;
    else if (ch === "]") inB = false;
    else { letters.push(ch); focus.push(inB); }
  }
  return { ...extra, raw, plain: letters.join(""), letters, focus };
}
let TOTAL_WORDS = 0;
{
  const all = new Set();
  for (const g of GRADES) {
    DATA[g].lessons.forEach((L, li) => {
      L.items = L.words.map((w, wi) => parseWord(w.w, { s: w.s, m: w.m, e: w.e, d: w.d, say: w.say, pos: w.pos, syn: w.syn, ant: w.ant, root: w.root, g, li, wi }));
      L.ex = (L.examples || []).map(e => parseWord(e));
      L.games = L.games || KID_GAMES;
      L.items.forEach(it => all.add(it.plain));
    });
  }
  TOTAL_WORDS = all.size;
}
const LEVEL_LABEL = { tk: "TK", k: "Kindergarten", gre: "GRE" };
const levelLabel = g => LEVEL_LABEL[g] || `Grade ${g}`;
const levelShort = g => ({ tk: "TK", k: "K", gre: "GRE" }[g] || String(g));
const LITTLE = new Set(["tk", "k"]);   // pre-readers: spoken praise and prompts
const SPOKEN = window.SPOKEN;
const READ_ALOUD_VOICE = "af_sky";   // "Read it to me" voice; games use the main voice (af_heart)
// what the voice says for a word: an explicit `say`, or the letter NAME for one-letter items
const sayText = it => it.say || (it.plain.length === 1 ? it.plain.toUpperCase() : it.plain);
const lessonGames = L => GAMES.filter(gm => L.games.includes(gm.id)).map(gm => gameInfo(gm.id, L.items[0].g));
const picHTML = it => (it.e ? `<div class="pic">${it.e}</div>` : "");
const lesson = (g, li) => DATA[g].lessons[li];

function wordHTML(it, opt = {}) {
  return it.letters.map((ch, i) => it.focus[i] && !opt.plain ? `<span class="focus">${esc(ch)}</span>` : esc(ch)).join("");
}
function displayHTML(it) { return it.d ? `<span class="focus">${esc(it.d)}</span>` : wordHTML(it); }
// split sentence around the target word (whole-word, case-insensitive)
function splitSentence(it) {
  const s = it.s, low = s.toLowerCase(), w = it.plain.toLowerCase();
  const isL = c => /[a-z']/i.test(c || "");
  let i = low.indexOf(w);
  while (i >= 0) {
    if (!isL(s[i - 1]) && !isL(s[i + w.length])) return [s.slice(0, i), s.slice(i, i + w.length), s.slice(i + w.length)];
    i = low.indexOf(w, i + 1);
  }
  return [s, "", ""];
}
function sentenceHTML(it, mode) {
  const [a, w, b] = splitSentence(it);
  if (!w) return esc(it.s);
  const mid = mode === "blank" ? `<span class="blank">&nbsp;</span>` : `<span class="hl">${esc(w)}</span>`;
  return `${esc(a)}${mid}${esc(b)}`;
}

const FACTS = [
  "The letter <b>E</b> is the most common letter in English words!",
  "In <b>queue</b>, only the first letter is said — the other four letters are just waiting in line!",
  "<b>Silent letters</b> like the k in knee were once spoken out loud, hundreds of years ago.",
  "The word <b>set</b> has more meanings than almost any other English word — over 400!",
  "Magic <b>e</b> is silent, but it makes the vowel before it say its name: hop → hope.",
  "<b>Bookkeeper</b> has three double letters in a row: oo, kk, ee!",
  "The dot over a lowercase <b>i</b> or <b>j</b> is called a <b>tittle</b>.",
  "<b>Q</b> is almost always followed by <b>u</b> in English words, like queen and quiet.",
  "Saying a word slowly and clapping its syllables helps you spell long words one chunk at a time.",
  "<b>Pneumonia</b> starts with a silent p, and <b>psychology</b> does too!",
  "Lots of science words come from Greek: <b>tele</b> means far and <b>phone</b> means sound.",
  "The longest common one-syllable words include <b>strengths</b> and <b>scratched</b>.",
  "<b>Homophones</b> sound the same but are spelled differently: their, there, and they're.",
  "Writing a tricky word three times and then from memory is a great way to learn it.",
  "In <b>Wednesday</b>, saying it the funny way — Wed-NES-day — helps you remember the d!",
  "English borrowed words from many languages: <b>pizza</b> (Italian), <b>ballet</b> (French), <b>kindergarten</b> (German).",
  "The word <b>alphabet</b> comes from the first two Greek letters: alpha and beta.",
  "A <b>pangram</b> uses every letter of the alphabet: The quick brown fox jumps over the lazy dog.",
  "Many words ending in <b>-tion</b> are things or ideas: action, nation, invention.",
  "The suffix <b>-less</b> means without: fearless means without fear!",
];
const PRAISE_GREAT = ["Awesome!", "Super!", "Perfect!", "Fantastic!", "Brilliant!", "Wow!", "You got it!", "Amazing!", "Great job!"];
const PRAISE_OK = ["Good!", "Nice!", "Well done!", "Keep going!", "You did it!"];

/* ---------------- badges ---------------- */
const BADGES = [
  { id: "first", icon: "🐣", name: "First Steps", desc: "Finish your first game", bg: "#FFE066" },
  { id: "learn0", icon: "🐼", name: "Careful Panda", desc: "Finish Look & Learn with no mistakes", bg: "#C9F3E4" },
  { id: "test1", icon: "🐝", name: "Busy Bee", desc: "Pass your first Spelling Bee", bg: "#FFD43B" },
  { id: "perfect", icon: "🌟", name: "Perfect Speller", desc: "Get 3 stars in a Spelling Bee", bg: "#FF9AD5" },
  { id: "perfect5", icon: "👑", name: "Spelling Royalty", desc: "Get 3 stars in 5 Spelling Bees", bg: "#C59AFF" },
  { id: "alltypes", icon: "🎪", name: "Game Explorer", desc: "Play all 5 kinds of games", bg: "#40C8FF" },
  { id: "balloon", icon: "🎈", name: "Balloon Master", desc: "Pop all 10 balloons in one game", bg: "#FF8A80" },
  { id: "combo", icon: "🔥", name: "On Fire", desc: "Spell 10 words in a row right on the first try", bg: "#FF7A45" },
  { id: "review", icon: "🎲", name: "Review Rockstar", desc: "Finish a Review Mix", bg: "#7FB8FF" },
  { id: "tricky5", icon: "🦁", name: "Tricky Tamer", desc: "Master 5 tricky words", bg: "#FFB347" },
  { id: "tricky25", icon: "🦸", name: "Super Fixer", desc: "Master 25 tricky words", bg: "#FF6F91" },
  { id: "w25", icon: "🐢", name: "25 Words", desc: "Spell 25 different words in Spelling Bees", bg: "#48D4AE" },
  { id: "w100", icon: "🦉", name: "Wise Owl", desc: "Spell 100 different words", bg: "#3797FF" },
  { id: "w250", icon: "🐉", name: "Word Dragon", desc: "Spell 250 different words", bg: "#FF3D7A" },
  { id: "wall", icon: "🦄", name: "Spelling Legend", desc: "Spell every word in Spelling Land", bg: "#E0B3FF" },
  { id: "stars50", icon: "⭐", name: "Star Collector", desc: "Collect 50 stars", bg: "#FFE066" },
  { id: "stars200", icon: "💎", name: "Star Treasure", desc: "Collect 200 stars", bg: "#9EE7FF" },
  { id: "gtk", icon: "🧸", name: "TK Hero", desc: "Pass every TK Spelling Bee", bg: "#FFD3A8" },
  { id: "gk", icon: "🌈", name: "Kindergarten Hero", desc: "Pass every Kindergarten Spelling Bee", bg: "#FFC9C2" },
  { id: "g2", icon: "🍭", name: "Grade 2 Hero", desc: "Pass every Grade 2 Spelling Bee", bg: "#FFC2D9" },
  { id: "g3", icon: "🐠", name: "Grade 3 Hero", desc: "Pass every Grade 3 Spelling Bee", bg: "#B5E9FF" },
  { id: "g4", icon: "🐯", name: "Grade 4 Hero", desc: "Pass every Grade 4 Spelling Bee", bg: "#B8F0DC" },
  { id: "g5", icon: "🚀", name: "Grade 5 Hero", desc: "Pass every Grade 5 Spelling Bee", bg: "#D9C8FF" },
  { id: "ggre", icon: "🎓", name: "GRE Scholar", desc: "Pass every GRE Word Recall", bg: "#B9C3FF" },
  { id: "days3", icon: "📅", name: "Practice Pal", desc: "Practice on 3 different days", bg: "#FFD6A5" },
  { id: "days7", icon: "🏅", name: "Week of Words", desc: "Practice on 7 different days", bg: "#FFC75F" },
  { id: "days30", icon: "🏆", name: "Spelling Champion", desc: "Practice on 30 different days", bg: "#FFB020" },
];
const STARTER_AVATARS = ["🐣", "🐱", "🐶", "🐼", "🦊", "🐸", "🐰", "🐻", "🐨", "🐵", "🐧", "🐙"];

/* ---------------- storage ---------------- */
const STORE_KEY = "spellingland.v1";
let DB;
try { DB = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { DB = null; }
if (!DB || !Array.isArray(DB.profiles)) DB = { profiles: [], current: null, settings: {} };
DB.settings = Object.assign({ sfx: true, music: true, rate: 0.85, voice: "", unlockAll: false }, DB.settings);
// older saves used numeric grades; levels are string ids now ("tk", "k", "2" … "gre")
for (const p of DB.profiles) {
  p.grade = DATA[String(p.grade)] ? String(p.grade) : "2";
  if (!p.last || !DATA[String(p.last.g)]) p.last = { g: p.grade, li: 0 };
  p.last.g = String(p.last.g);
  // tricky words point at (level, lesson, index); re-find words whose lesson changed, drop ones that no longer exist
  for (const [w, t] of Object.entries(p.tricky || {})) {
    const L = DATA[String(t.g)] && DATA[String(t.g)].lessons[t.li];
    if (L && L.items[t.wi] && L.items[t.wi].plain === w) continue;
    const hit = GRADES.flatMap(g => DATA[g].lessons.flatMap(l => l.items)).find(it => it.plain === w);
    if (hit) Object.assign(t, { g: hit.g, li: hit.li, wi: hit.wi }); else delete p.tricky[w];
  }
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) { /* storage full or blocked */ } }
function P() { return DB.profiles.find(p => p.id === DB.current) || null; }
function newProfile(name, avatar, grade) {
  return {
    id: Date.now().toString(36) + rand(1e6).toString(36), name, avatar, grade,
    progress: {}, tricky: {}, badges: {}, last: { g: grade, li: 0 },
    stats: { games: 0, mastered: {}, streak: 0, bestStreak: 0, days: [], trickyDone: 0, types: {}, perfectBalloon: 0, learnPerfect: 0, reviews: 0 },
  };
}
const prog = (p, g, li) => (p.progress[`${g}-${li}`] = p.progress[`${g}-${li}`] || {});
const progR = (p, g, li) => p.progress[`${g}-${li}`] || {};
function totalStars(p) { let n = 0; for (const k in p.progress) for (const gm of GAMES) n += p.progress[k][gm.id] || 0; return n; }
function gradeStats(p, g) {
  let passed = 0, stars = 0, maxStars = 0;
  DATA[g].lessons.forEach((L, li) => { const r = progR(p, g, li); if ((r.test || 0) >= 1) passed++; for (const gm of GAMES) stars += r[gm.id] || 0; maxStars += L.games.length * 3; });
  return { passed, stars, maxStars, total: DATA[g].lessons.length };
}
function isUnlocked(p, g, li) { return DB.settings.unlockAll || li === 0 || (progR(p, g, li - 1).test || 0) >= 1; }
function nextLessonIndex(p, g) {
  const L = DATA[g].lessons;
  for (let i = 0; i < L.length; i++) if (isUnlocked(p, g, i) && (progR(p, g, i).test || 0) < 1) return i;
  return -1;
}
function nextGameId(p, g, li) {
  const r = progR(p, g, li);
  const g0 = lessonGames(lesson(g, li)).find(gm => !r[gm.id]);
  return g0 ? g0.id : "test";
}

function applySettings() {
  Sound.sfxOn = DB.settings.sfx;
  Sound.musicOn = DB.settings.music;
  Voice.rate = DB.settings.rate;
  Voice.voiceName = DB.settings.voice;
  Voice.voice = null;
  if (!Sound.musicOn) Sound.stopMusic(); else if (Sound.ctx) Sound.startMusic();
}

/* ---------------- router ---------------- */
const app = $("#app");
let keyHandler = null;
let current = { name: "title", args: [] };
function go(name, ...args) {
  stopGame();
  Voice.stop();
  keyHandler = null;
  current = { name, args };
  SCREENS[name](...args);
  app.scrollTop = 0;
}
function refresh() { go(current.name, ...current.args); }

document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
  if ($(".modal-back")) return;
  let k = e.key;
  if (k === "’" || k === "‘" || k === "`") k = "'";
  if (k.length === 1) k = k.toLowerCase();
  if (keyHandler) {
    if (k === " " || k === "Backspace" || k === "'" || k === "/") e.preventDefault();
    Sound.resume();
    Voice.unlock();
    keyHandler(k, e);
  }
});
document.addEventListener("pointerdown", () => { Sound.resume(); Voice.unlock(); }, { passive: true });

// event delegation for [data-act]
const ACT = {};
app.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el || !app.contains(el)) return;
  Sound.resume();
  const fn = ACT[el.dataset.act];
  if (fn) { fn(el, e); }
});
document.body.addEventListener("click", e => {
  const el = e.target.closest(".modal [data-act]");
  if (!el) return;
  const fn = ACT[el.dataset.act];
  if (fn) fn(el, e);
});

/* ---------------- shared UI bits ---------------- */
// Ollie the owl — the Spelling Land mascot (original drawing)
const OWL_SVG = (cls = "owl-svg") => `<svg class="${cls}" viewBox="0 0 200 210" aria-hidden="true">
  <ellipse cx="100" cy="198" rx="58" ry="9" fill="rgba(59,47,74,.14)"/>
  <path d="M60 58 L48 20 L86 44Z" fill="#7B5CFF"/><path d="M140 58 L152 20 L114 44Z" fill="#7B5CFF"/>
  <path d="M38 118 C38 60 68 34 100 34 C132 34 162 60 162 118 C162 168 136 192 100 192 C64 192 38 168 38 118Z" fill="#8C6CFF"/>
  <path d="M40 120 C22 128 22 160 46 166 C50 150 48 134 40 120Z" fill="#6E4FE6"/>
  <path d="M160 120 C178 128 178 160 154 166 C150 150 152 134 160 120Z" fill="#6E4FE6"/>
  <ellipse cx="100" cy="142" rx="40" ry="42" fill="#FFF1D6"/>
  <path d="M84 132 q6 6 12 0 M104 132 q6 6 12 0 M94 148 q6 6 12 0 M84 162 q6 6 12 0 M104 162 q6 6 12 0" stroke="#F2C98E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g class="owl-eyes">
    <circle cx="74" cy="92" r="25" fill="#fff"/><circle cx="126" cy="92" r="25" fill="#fff"/>
    <circle cx="78" cy="95" r="12" fill="#3B2F4A"/><circle cx="122" cy="95" r="12" fill="#3B2F4A"/>
    <circle cx="82" cy="90" r="4.5" fill="#fff"/><circle cx="126" cy="90" r="4.5" fill="#fff"/>
  </g>
  <path d="M91 112 L109 112 L100 126Z" fill="#FFB020" stroke="#F09A00" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="56" cy="116" rx="9" ry="6" fill="#FF8FB1" opacity=".75"/><ellipse cx="144" cy="116" rx="9" ry="6" fill="#FF8FB1" opacity=".75"/>
  <path d="M82 190 l-6 10 M90 190 l0 11 M98 190 l6 10 M110 190 l-6 10 M118 190 l0 11 M126 190 l6 10" stroke="#FFB020" stroke-width="5" stroke-linecap="round"/>
  <g transform="rotate(28 166 150)"><rect x="159" y="104" width="15" height="62" rx="3" fill="#FFC83D"/><rect x="159" y="100" width="15" height="10" rx="3" fill="#FF8FB1"/><path d="M159 166 L174 166 L166.5 184Z" fill="#F5D7A8"/><path d="M163.5 177 L169.5 177 L166.5 184Z" fill="#3B2F4A"/></g>
</svg>`;

const WORDMARK_COLORS = ["#FF5C8A", "#FF9A3D", "#FFC83D", "#2EC27E", "#4DB6FF", "#7B5CFF"];
function logoHTML() {
  let n = 0;
  const line = (word, cls) => `<div class="wm-line ${cls}">${[...word].map(ch =>
    `<span class="wm-letter" data-letter="${ch.toLowerCase()}" style="color:${WORDMARK_COLORS[n % WORDMARK_COLORS.length]};animation-delay:${(n++) * 0.07}s">${ch}</span>`).join("")}</div>`;
  return `<div class="logo2">
    <div class="logo-owl">${OWL_SVG()}</div>
    <div class="wordmark">${line("Spelling", "")}${line("Land", "land")}<div class="ribbon"><span>spell · play · grow</span></div></div>
  </div>`;
}

function topbarHTML(opts = {}) {
  const p = P();
  const back = opts.back ? `<button class="icon-btn" data-act="${opts.back}" title="Back">⬅</button>` : "";
  const who = p ? `<div class="player-chip" data-act="toTitle" title="Switch player"><div class="avatar">${p.avatar}</div><div class="name">${esc(p.name)}</div></div>` : "";
  const right = p ? `
    <div class="pill" title="Stars">⭐ ${totalStars(p)}</div>
    <div class="pill clickable" data-act="toBadges" title="Badges">🏅 ${Object.keys(p.badges).length}/${BADGES.length}</div>
    <button class="icon-btn" data-act="openSettings" title="Settings">⚙️</button>` : "";
  return `<div class="topbar">${back}${opts.middle || who}<div class="spacer"></div>${right}</div>`;
}

function mascot(text) {
  return `<div class="mascot"><div class="owl">${OWL_SVG("owl-mini")}</div><div class="bubble">${text}</div></div>`;
}

function praise(text) {
  const st = $(".game-top");
  if (!st) return;
  const el = document.createElement("div");
  el.className = "praise";
  el.textContent = text;
  st.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function confetti(x, y, n = 28, spread = 1) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.background = pick(TILE_COLORS);
    if (Math.random() < 0.4) c.style.borderRadius = "50%";
    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = (60 + Math.random() * 160) * spread;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 80 * spread;
    const anim = c.animate([
      { transform: `translate(${x}px, ${y}px) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${x + dx}px, ${y + dy}px) rotate(${rand(360)}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${x + dx * 1.2}px, ${y + dy + 260}px) rotate(${rand(720)}deg)`, opacity: 0 },
    ], { duration: 1100 + rand(700), easing: "cubic-bezier(.2,.7,.4,1)" });
    anim.onfinish = () => c.remove();
  }
}
function confettiAt(el, n, spread) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2, n, spread);
}

function toastQueue(badges) {
  let i = 0;
  const showNext = () => {
    if (i >= badges.length) return;
    const b = badges[i++];
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<div class="bcircle" style="background:${b.bg}">${b.icon}</div><div><small>New badge!</small><b>${esc(b.name)}</b><span>${esc(b.desc)}</span></div>`;
    document.body.appendChild(t);
    Sound.badge();
    confettiAt(t, 30, 0.8);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; }, 2700);
    setTimeout(() => { t.remove(); showNext(); }, 3000);
  };
  showNext();
}

function modal(html) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal">${html}</div>`;
  back.addEventListener("pointerdown", e => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  return back;
}
function closeModal() { const m = $(".modal-back"); if (m) m.remove(); }

/* ---------------- screens ---------------- */
const SCREENS = {};

SCREENS.title = () => {
  const p = P();
  const cards = DB.profiles.map(pr => `
    <div class="profile-card ${p && pr.id === p.id ? "active" : ""}" data-act="pickProfile" data-id="${pr.id}">
      <div class="avatar">${pr.avatar}</div>
      <div><div class="pname">${esc(pr.name)}</div><div class="pstars">⭐ ${totalStars(pr)} · ${esc(levelLabel(pr.grade))}</div></div>
    </div>`).join("");
  app.innerHTML = `
    <div class="screen title-screen">
      ${logoHTML()}
      <div class="profiles">${cards}<div class="profile-card add" data-act="newProfile">＋ New player</div></div>
      ${p ? `<button class="btn big pink" data-act="toHome">▶ Play</button>` : `<div class="title-foot"><b>Who's playing?</b> Make a player to start your spelling adventure!</div>`}
      <div class="title-foot">🎧 Turn on your sound! · From TK to 5th grade, plus GRE · ${TOTAL_WORDS} spelling words in ${GRADES.length} worlds<br>Works best with a keyboard — you can also tap the on-screen keys.</div>
      <a class="credit" href="https://linkedin.com/in/sc268" target="_blank" rel="noopener">made by SC</a>
    </div>`;
  keyHandler = k => {
    $$(".wm-letter").forEach(t => {
      if (t.dataset.letter === k) { t.style.animation = "none"; void t.offsetWidth; t.style.animation = "hopLetter .5s ease"; }
    });
    if (/^[a-z]$/.test(k)) Sound.letter(k.charCodeAt(0) - 97);
    if (k === "Enter" && P()) { Sound.click(); go("home"); }
  };
};

SCREENS.home = () => {
  const p = P();
  if (!p) return go("title");
  const worlds = GRADES.map(g => {
    const st = gradeStats(p, g), w = WORLD[g];
    return `<div class="world" data-act="toGrade" data-g="${g}" style="background:linear-gradient(140deg, ${w.c2}, ${w.color})">
      <div class="wemoji">${w.emoji}</div>
      <div class="wgrade">${esc(levelLabel(g))}</div>
      <div class="wtheme">${g === "tk" ? "Transitional Kindergarten · " : ""}${esc(DATA[g].theme)}${p.grade === g ? " · your level" : ""}</div>
      <div class="wstat"><span>${st.passed}/${st.total} lessons</span><span>⭐ ${st.stars}</span></div>
      <div class="wbar"><div style="width:${Math.round(st.passed / st.total * 100)}%"></div></div>
    </div>`;
  }).join("");
  const nTricky = Object.keys(p.tricky).length;
  const played = Object.keys(p.progress).length;
  const last = p.last || { g: p.grade, li: 0 };
  const L = lesson(last.g, last.li);
  const hello = played
    ? `Welcome back, <b>${esc(p.name)}</b>! Ready for more? Keep going with <b>${esc(levelLabel(last.g))}: ${esc(L.title)}</b>${nTricky ? `, or practice your <b>${nTricky} tricky word${nTricky > 1 ? "s" : ""}</b>` : ""}.`
    : `Hi <b>${esc(p.name)}</b>! I'm Ollie the Owl. Pick a world to start. Each lesson teaches a spelling pattern, then you play games to learn the words!`;
  app.innerHTML = `
    <div class="screen scroll">
      ${topbarHTML()}
      <div class="home-body">
        ${mascot(hello)}
        <div class="home-actions">
          <button class="btn big pink" data-act="continue">▶ Continue</button>
          <button class="btn mint" data-act="startTricky" ${nTricky ? "" : "disabled"}>🧠 Tricky Words${nTricky ? ` (${nTricky})` : ""}</button>
          <button class="btn blue" data-act="startReview" ${played ? "" : "disabled"}>🎲 Review Mix</button>
        </div>
        <div class="worlds">${worlds}</div>
      </div>
    </div>`;
};

SCREENS.grade = g => {
  const p = P();
  const w = WORLD[g];
  const next = nextLessonIndex(p, g);
  const tiles = DATA[g].lessons.map((L, li) => {
    const r = progR(p, g, li), open = isUnlocked(p, g, li);
    const dots = lessonGames(L).map(gm => `<span style="${r[gm.id] ? `background:${gm.color}` : ""}" title="${gm.name}"></span>`).join("");
    return `<div class="lesson-tile ${open ? "" : "locked"} ${li === next ? "next" : ""}" data-act="${open ? "toLesson" : "locked"}" data-g="${g}" data-li="${li}">
      ${li === next ? `<div class="next-flag">Next!</div>` : ""}
      <div class="lnum">${open ? li + 1 : "🔒"}</div>
      <div class="licon">${L.icon}</div>
      <div class="ltitle">${esc(L.title)}</div>
      <div class="lstars">${starsHTML(r.test || 0)}</div>
      <div class="ldots">${dots}</div>
    </div>`;
  }).join("");
  const st = gradeStats(p, g);
  app.innerHTML = `
    <div class="screen scroll grade-screen" style="--wc:${w.color};--wc-light:${w.light}">
      ${topbarHTML({ back: "toHome", middle: `<div class="grade-head"><div class="avatar">${w.emoji}</div><div><h1>${esc(levelLabel(g))} · ${esc(DATA[g].theme)}</h1><div class="sub">${st.passed} of ${st.total} lessons passed · ⭐ ${st.stars} / ${st.maxStars}</div></div></div>` })}
      <div class="lessons">${tiles}</div>
    </div>`;
};

SCREENS.lesson = (g, li) => {
  const p = P();
  const L = lesson(g, li), w = WORLD[g], r = progR(p, g, li);
  p.last = { g, li }; save();
  const nextId = nextGameId(p, g, li);
  const games = lessonGames(L).map((gm, i) => `
    <button class="game-btn ${gm.id === nextId ? "next" : ""}" data-act="startGame" data-mode="${gm.id}">
      <div class="gicon" style="background:${gm.color}22">${gm.icon}</div>
      <div><div class="gstep">Step ${i + 1}${gm.id === nextId ? " · next" : ""}</div><div class="gname">${gm.name}</div><div class="gdesc">${gm.desc}</div></div>
      <div class="gstars">${starsHTML(r[gm.id] || 0)}</div>
    </button>`).join("");
  const examples = L.ex.map((e, i) => `<div class="example" data-act="sayEx" data-i="${i}"><span>${wordHTML(e)}</span><small>🔊</small></div>`).join("");
  const chips = L.items.map((it, i) => `<span class="chip ${p.stats.mastered[it.plain] ? "known" : ""}" data-act="sayWord" data-i="${i}">${it.e ? it.e + " " : ""}${displayHTML(it)}</span>`).join("");
  app.innerHTML = `
    <div class="screen scroll lesson-screen" style="--wc:${w.color};--wc-light:${w.light}">
      ${topbarHTML({ back: "backToGrade", middle: `<div class="grade-head"><div class="avatar">${L.icon}</div><div><h1>${esc(L.title)}</h1><div class="sub">${esc(levelLabel(g))} · Lesson ${li + 1} of ${DATA[g].lessons.length}</div></div></div>` })}
      <div class="lesson-body">
        <div class="card rule-card">
          <div class="kicker">${g === "gre" ? "Meaning cluster" : "Spelling pattern"}</div>
          <h2>${L.icon} ${esc(L.title)}</h2>
          <div class="rule-text">${esc(L.rule)}</div>
          <div class="tip">💡 <span>${esc(L.tip)}</span></div>
          <div class="examples">${examples}</div>
          <button class="btn sky small" data-act="readRule">🔊 Read it to me</button>
          <h3 class="section">This lesson's ${L.items.length} words</h3>
          <div class="word-chips">${chips}</div>
          <div class="meaning-box" id="meaningBox">Tap a word to hear it and see what it means.</div>
        </div>
        <div class="games">${games}</div>
      </div>
    </div>`;
};

SCREENS.badges = () => {
  const p = P();
  const grid = BADGES.map(b => {
    const got = !!p.badges[b.id];
    return `<div class="badge ${got ? "" : "locked"} ${got && p.avatar === b.icon ? "current" : ""}" data-act="${got ? "setAvatar" : "lockedBadge"}" data-icon="${b.icon}">
      <div class="bcircle" style="background:${b.bg}">${got ? b.icon : "?"}</div>
      <div class="bname">${esc(b.name)}</div><div class="bdesc">${esc(b.desc)}</div></div>`;
  }).join("");
  app.innerHTML = `
    <div class="screen scroll">
      ${topbarHTML({ back: "toHome", middle: `<div class="grade-head"><div class="avatar">🏅</div><div><h1>Badges</h1><div class="sub">${Object.keys(p.badges).length} of ${BADGES.length} collected · tap a badge to make it your picture</div></div></div>` })}
      <div class="badges-grid">${grid}</div>
    </div>`;
};

/* ---------------- actions ---------------- */
ACT.toTitle = () => go("title");
ACT.toHome = () => { Sound.click(); go("home"); };
ACT.toBadges = () => { Sound.click(); go("badges"); };
ACT.toGrade = el => { Sound.click(); go("grade", el.dataset.g); };
ACT.toLesson = el => { Sound.click(); go("lesson", el.dataset.g, +el.dataset.li); };
ACT.backToGrade = () => { Sound.click(); go("grade", current.args[0]); };
ACT.locked = el => {
  Sound.wrong();
  el.classList.remove("shake"); void el.offsetWidth; el.style.animation = "shake .35s";
  setTimeout(() => (el.style.animation = ""), 400);
  Voice.say(SPOKEN.locked);
};
ACT.lockedBadge = () => Sound.wrong();
ACT.setAvatar = el => { const p = P(); p.avatar = el.dataset.icon; save(); Sound.star(); go("badges"); };
ACT.pickProfile = el => { DB.current = el.dataset.id; save(); Sound.click(); go("home"); };
ACT.continue = () => {
  const p = P();
  const last = p.last || { g: p.grade, li: 0 };
  let { g, li } = last;
  const r = progR(p, g, li);
  // if this lesson is fully done, move on to the next one
  if (lessonGames(lesson(g, li)).every(gm => r[gm.id]) && li + 1 < DATA[g].lessons.length && isUnlocked(p, g, li + 1)) li++;
  Sound.click();
  go("lesson", g, li);
};
ACT.sayEx = el => { const [g, li] = current.args; Voice.say(sayText(lesson(g, li).ex[+el.dataset.i]), { voice: READ_ALOUD_VOICE }); };
ACT.sayWord = el => {
  const [g, li] = current.args;
  const it = lesson(g, li).items[+el.dataset.i];
  $("#meaningBox").innerHTML = `<b class="focus" style="font-family:var(--font-word);font-size:22px">${esc(it.plain)}</b>${it.pos ? ` <i>(${esc(it.pos)})</i>` : ""} — ${esc(it.m)}. <i>“${sentenceHTML(it, "hl")}”</i>${it.syn ? `<br><b>Synonyms:</b> ${esc(it.syn.join(", "))}${it.ant && it.ant.length ? ` · <b>Antonyms:</b> ${esc(it.ant.join(", "))}` : ""}` : ""}`;
  Voice.say([sayText(it), it.s]);
};
ACT.readRule = () => { const [g, li] = current.args; const L = lesson(g, li); Voice.say([L.title, L.rule, L.tip, ...L.ex.map(sayText)], { voice: READ_ALOUD_VOICE }); };
ACT.startGame = el => {
  const [g, li] = current.args;
  Sound.click();
  startGame(el.dataset.mode, { g, li });
};
ACT.startTricky = () => {
  const p = P();
  const keys = shuffle(Object.keys(p.tricky)).slice(0, 10);
  const items = keys.map(k => { const t = p.tricky[k]; return lesson(t.g, t.li).items[t.wi]; }).filter(Boolean);
  if (!items.length) return;
  startGame("tricky", { items });
};
ACT.startReview = () => {
  const p = P();
  const pool = [];
  for (const key in p.progress) {
    const cut = key.lastIndexOf("-"), g = key.slice(0, cut), li = +key.slice(cut + 1);
    if (DATA[g] && DATA[g].lessons[li]) pool.push(...lesson(g, li).items);
  }
  if (!pool.length) return;
  // favor words not yet mastered
  const fresh = shuffle(pool.filter(it => !p.stats.mastered[it.plain]));
  const known = shuffle(pool.filter(it => p.stats.mastered[it.plain]));
  const items = [...fresh.slice(0, 7), ...known].slice(0, 10);
  if (items.length < 10) items.push(...fresh.slice(7, 7 + 10 - items.length));
  startGame("review", { items: shuffle(items) });
};

/* ----- profile modal ----- */
let draft = null;
ACT.newProfile = () => {
  draft = { avatar: pick(STARTER_AVATARS), grade: "2" };
  renderProfileModal();
};
function renderProfileModal() {
  const m = modal(`
    <h2>New player</h2>
    <div class="field"><label>What's your name?</label><input class="text-input" id="pname" maxlength="16" placeholder="Your name" autocomplete="off"></div>
    <div class="field"><label>What level? <small style="font-weight:600;color:var(--soft)">TK, Kindergarten, grades 2–5, or GRE</small></label>
      <div class="avatar-pick">${GRADES.map(g => `<button data-act="draftGrade" data-g="${g}" class="${draft.grade === g ? "sel" : ""}" style="font-family:var(--font-title);font-size:${g === "gre" ? 17 : 22}px;font-weight:700">${levelShort(g)}</button>`).join("")}</div></div>
    <div class="field"><label>Pick your buddy</label>
      <div class="avatar-pick">${STARTER_AVATARS.map(a => `<button data-act="draftAvatar" data-a="${a}" class="${draft.avatar === a ? "sel" : ""}">${a}</button>`).join("")}</div></div>
    <div class="modal-actions"><button class="btn ghost" data-act="closeModal">Cancel</button><button class="btn pink" data-act="createProfile">Let's go! ▶</button></div>`);
  const inp = $("#pname", m);
  inp.value = draft.name || "";
  inp.addEventListener("input", () => (draft.name = inp.value));
  inp.addEventListener("keydown", e => { if (e.key === "Enter") ACT.createProfile(); });
  setTimeout(() => inp.focus(), 50);
}
ACT.draftGrade = el => { draft.grade = el.dataset.g; Sound.click(); renderProfileModal(); };
ACT.draftAvatar = el => { draft.avatar = el.dataset.a; Sound.letter(rand(8)); renderProfileModal(); };
ACT.closeModal = () => closeModal();
ACT.createProfile = () => {
  const name = (draft.name || "").trim();
  if (!name) { const i = $("#pname"); i.style.borderColor = "#FF8A80"; i.focus(); Sound.wrong(); return; }
  const p = newProfile(name, draft.avatar, draft.grade);
  DB.profiles.push(p);
  DB.current = p.id;
  save();
  closeModal();
  Sound.fanfare();
  go("home");
};

/* ----- settings modal ----- */
let confirmStep = "";
ACT.openSettings = () => { confirmStep = ""; renderSettings(); };
function renderSettings() {
  const s = DB.settings, p = P();
  const voices = Voice.list();
  const sw = (key, on) => `<button class="switch ${on ? "on" : ""}" data-act="toggleSetting" data-k="${key}" aria-label="${key}"></button>`;
  modal(`
    <h2>⚙️ Settings</h2>
    <div class="toggle-row">🔔 Sound effects ${sw("sfx", s.sfx)}</div>
    <div class="toggle-row">🎵 Music ${sw("music", s.music)}</div>
    <div class="toggle-row">🗣️ Voice speed
      <span><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${s.rate}"> <span id="rateVal">${Number(s.rate).toFixed(2)}×</span></span></div>
    <div class="toggle-row">🎙️ Voice
      <select id="voiceSel"><option value="">⭐ Spelling Land voice${Voice.clips.size ? "" : " (not recorded yet)"}</option>${voices.map(v => `<option value="${esc(v.name)}" ${v.name === s.voice ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select></div>
    <div class="toggle-row"><span>🔓 Unlock all lessons<br><small style="font-weight:600;color:var(--soft)">For teachers & parents</small></span> ${sw("unlockAll", s.unlockAll)}</div>
    ${Voice.supported ? "" : `<p class="danger">This browser can't speak words out loud. Try Chrome, Edge, or Safari.</p>`}
    ${p ? `<div class="toggle-row"><span>👤 ${esc(p.name)}</span><span>
      <button class="btn small ghost danger" data-act="resetPlayer">${confirmStep === "reset" ? "Really reset?" : "Reset progress"}</button>
      <button class="btn small ghost danger" data-act="deletePlayer">${confirmStep === "delete" ? "Really delete?" : "Delete player"}</button></span></div>` : ""}
    <div class="modal-actions"><button class="btn small sky" data-act="testVoice">🔊 Test voice</button><button class="btn pink" data-act="closeModal">Done</button></div>`);
  const rate = $("#rate");
  rate.addEventListener("input", () => { DB.settings.rate = +rate.value; $("#rateVal").textContent = (+rate.value).toFixed(2) + "×"; applySettings(); save(); });
  $("#voiceSel").addEventListener("change", e => { DB.settings.voice = e.target.value; applySettings(); save(); Voice.say(SPOKEN.hello); });
}
ACT.toggleSetting = el => {
  const k = el.dataset.k;
  DB.settings[k] = !DB.settings[k];
  save(); applySettings(); Sound.click();
  renderSettings();
  if (k === "unlockAll" && (current.name === "grade" || current.name === "lesson")) {
    const keep = $(".modal").innerHTML; refresh(); modal(keep);
  }
};
ACT.testVoice = () => Voice.say(SPOKEN.hello);
ACT.resetPlayer = () => {
  if (confirmStep !== "reset") { confirmStep = "reset"; return renderSettings(); }
  const p = P(); const fresh = newProfile(p.name, p.avatar, p.grade); fresh.id = p.id;
  DB.profiles[DB.profiles.indexOf(p)] = fresh; save(); closeModal(); go("home");
};
ACT.deletePlayer = () => {
  if (confirmStep !== "delete") { confirmStep = "delete"; return renderSettings(); }
  DB.profiles = DB.profiles.filter(p => p.id !== DB.current);
  DB.current = DB.profiles[0] ? DB.profiles[0].id : null;
  save(); closeModal(); go("title");
};

/* =================================================================
   GAME ENGINE
   strict modes (learn, gap, scramble, balloon): each key is checked as you type
   free modes   (test, tricky, review): type the whole word, then press Enter to check
   ================================================================= */
let G = null;
const FREE = new Set(["test", "tricky", "review"]);

function stopGame() {
  if (!G) return;
  G.timers.forEach(clearTimeout);
  if (G.raf) cancelAnimationFrame(G.raf);
  G = null;
  KB.el = null;
}
function later(fn, ms) { if (!G) return; const g = G; g.timers.push(setTimeout(() => { if (G === g) fn(); }, ms)); }
const cur = () => G.items[G.idx];

function startGame(mode, cfg) {
  stopGame();
  Voice.stop();
  const items = cfg.items ? cfg.items.slice()
    : MC.has(mode) ? mcItems(mode, cfg.g, cfg.li)
    : (mode === "learn" ? lesson(cfg.g, cfg.li).items.slice() : shuffle(lesson(cfg.g, cfg.li).items.slice()));
  G = {
    mode, cfg, items, free: FREE.has(mode), mc: MC.has(mode), idx: 0, results: [], mistakes: 0, score: 0, lives: 3, combo: 0, bestCombo: 0,
    start: Date.now(), note: 0, timers: [], raf: null, locked: false,
  };
  current = { name: "game", args: [mode, cfg] };
  if (!MC.has(mode)) Voice.prefetch(items.flatMap(it => [sayText(it), it.s, { text: sayText(it), slow: true }]));
  const gm = gameInfo(mode, cfg.g || (items[0] && items[0].g));
  const world = cfg.g ? WORLD[cfg.g] : null;
  app.innerHTML = `
    <div class="screen game-screen" style="${world ? `--wc:${world.color}` : ""}">
      <div class="game-top">
        <div class="topbar">
          <button class="icon-btn" data-act="quitGame" title="Quit">✕</button>
          <div class="game-title">${gm.icon} ${gm.name}${cfg.g ? ` <span style="opacity:.8;font-size:17px">· ${esc(lesson(cfg.g, cfg.li).title)}</span>` : ""}</div>
          <div class="spacer"></div>
          <div class="progress-pips" id="pips"></div>
          <div class="spacer"></div>
          <div class="pill" id="scorePill"></div>
          <button class="icon-btn" data-act="toggleSfxGame" id="sfxBtn" title="Sound">${DB.settings.sfx ? "🔊" : "🔇"}</button>
        </div>
        <div class="stage" id="stage"></div>
      </div>
      <div class="game-bottom" id="kb"></div>
    </div>`;
  if (MC.has(mode)) $("#kb").style.display = "none";
  else KB.mount($("#kb"), k => gameKey(k));
  keyHandler = k => gameKey(k);
  loadWord();
}
ACT.quitGame = () => {
  const cfg = G && G.cfg;
  Sound.click();
  if (cfg && cfg.g) go("lesson", cfg.g, cfg.li); else go("home");
};
ACT.toggleSfxGame = () => { DB.settings.sfx = !DB.settings.sfx; save(); applySettings(); $("#sfxBtn").textContent = DB.settings.sfx ? "🔊" : "🔇"; };

function renderPips() {
  const el = $("#pips");
  if (!el) return;
  el.innerHTML = G.items.map((_, i) => {
    const r = G.results[i];
    return `<span class="${r ? (r.ok ? "ok" : "miss") : i === G.idx ? "now" : ""}">★</span>`;
  }).join("");
  const pill = $("#scorePill");
  if (G.mode === "balloon") pill.innerHTML = `<span class="hearts">${"❤️".repeat(G.lives)}${"🤍".repeat(3 - G.lives)}</span> ${G.score}`;
  else if (G.free || G.mc) pill.innerHTML = `✅ ${G.results.filter(r => r.ok).length}${G.combo >= 2 ? ` · 🔥${G.combo}` : ""}`;
  else pill.innerHTML = `${G.idx + 1 > G.items.length ? G.items.length : G.idx + 1} / ${G.items.length}`;
}

function loadWord() {
  if (!G) return;
  if (G.idx >= G.items.length || (G.mode === "balloon" && G.lives <= 0)) return finishGame();
  const it = cur();
  G.wm = 0; G.lm = 0; G.step = 0; G.phase = "play"; G.locked = false;
  if (G.mc) { G.sel = []; renderPips(); return STAGE.mc(it); }
  G.typed = it.letters.map(() => null);
  G.input = [];
  G.given = it.letters.map((_, i) => (G.mode === "gap" ? !it.focus[i] : false));
  G.pos = nextPos(0);
  renderPips();
  STAGE[G.mode === "tricky" || G.mode === "review" ? "test" : G.mode](it);
  updateHint();
}
function nextPos(p) { while (p < G.typed.length && G.given[p]) p++; return p; }

/* ----- letter boxes ----- */
function boxesHTML(it) {
  return `<div class="boxes" id="boxes" style="--n:${Math.max(it.letters.length, 5)}">${it.letters.map((_, i) => `<div class="box" data-i="${i}"></div>`).join("")}</div>`;
}
function renderLetters() {
  const it = cur();
  const boxes = $$("#boxes .box");
  if (G.free && G.phase === "play") {
    boxes.forEach((b, i) => {
      const ch = G.input[i];
      b.className = "box" + (ch ? " filled" : i === G.input.length ? " current" : "");
      b.textContent = ch || "";
    });
    const full = G.input.length === it.letters.length;
    const cb = $("#checkBtn");
    if (cb) { cb.disabled = !full; cb.classList.toggle("speaking", full); }
    return;
  }
  boxes.forEach((b, i) => {
    let cls = "box", txt = "";
    if (G.given[i]) { cls += " given"; txt = it.letters[i]; }
    else if (G.typed[i]) { cls += " filled" + (it.focus[i] && G.mode !== "test" ? " focusL" : ""); txt = G.typed[i]; }
    else if (i === G.pos) cls += " current";
    b.className = cls;
    b.textContent = txt;
  });
  if (G.mode === "balloon") renderBalloonText();
  if (G.mode === "scramble") renderTiles();
}
function shakeBoxes(all) {
  const t = all ? $("#boxes") : $(`#boxes .box[data-i="${G.free ? G.input.length : G.pos}"]`) || $("#boxes");
  if (!t) return;
  t.classList.remove("shake"); void t.offsetWidth; t.classList.add("shake");
}

function updateHint() {
  if (!G) return;
  const it = cur();
  if (!it || G.pos >= it.letters.length) return KB.setNext(null);
  const show = (G.mode === "learn" && G.step === 0) || G.phase === "fix" || (!G.free && G.lm >= 2) || (G.mode === "learn" && G.lm >= 2);
  if (G.free && G.phase === "play") return KB.setNext(null);
  KB.setNext(show ? it.letters[G.pos] : null);
}

function speakCurrent(slow) {
  if (!G) return;
  const it = cur();
  const w = sayText(it);
  if (G.free) return Voice.say([w, it.s, w], { slow });
  return Voice.say(w, { slow });
}
ACT.speak = () => speakCurrent(false);
ACT.speakSlow = () => speakCurrent(true);
ACT.check = () => { if (G && G.free && G.phase === "play") checkFree(); };

/* ----- stage renderers ----- */
const STAGE = {};
const soundRow = (big, withSlow) => `<div class="sound-row"><button class="speak-btn ${big ? "big" : ""}" data-act="speak">🔊 ${big ? "Hear the word" : "Hear it"}</button>${withSlow ? `<button class="speak-btn slow ${big ? "big" : ""}" data-act="speakSlow">🐢 Slow</button>` : ""}</div>`;

STAGE.learn = it => {
  const cover = G.step === 1;
  $("#stage").innerHTML = `
    <div class="play-card">
      <div class="instruction">${cover ? "🙈 Now spell it from memory!" : "👀 Look · 👂 Listen · ⌨️ Type"}</div>
      ${picHTML(it)}
      <div class="big-word ${cover ? "covered" : ""}">${displayHTML(it)}</div>
      <div class="sentence">${sentenceHTML(it, cover ? "blank" : "hl")}</div>
      <div class="meaning"><b>Meaning:</b> ${it.pos ? `<i>(${esc(it.pos)})</i> ` : ""}${esc(it.m)}</div>
      ${it.syn && !cover ? `<div class="meaning"><b>Synonyms:</b> ${esc(it.syn.join(", "))}${it.ant && it.ant.length ? ` · <b>Antonyms:</b> ${esc(it.ant.join(", "))}` : ""}${it.root ? `<br>🌱 ${esc(it.root)}` : ""}</div>` : ""}
      ${boxesHTML(it)}
      <div class="sound-row"><button class="speak-btn" data-act="speak">🔊 Hear it</button></div>
      <div class="hint-line">${cover ? "Remember the pink letters — they're the pattern!" : "Follow the glowing key. Press <kbd>space</kbd> to hear the word again."}</div>
    </div>`;
  renderLetters();
  if (!cover) Voice.say(sayText(it));
};

STAGE.gap = it => {
  const L = lesson(it.g, it.li);
  $("#stage").innerHTML = `
    <div class="play-card">
      <div class="instruction">🧩 Type the missing letters</div>
      ${picHTML(it)}
      <div class="sentence">${sentenceHTML(it, "blank")}</div>
      ${boxesHTML(it)}
      <div class="meaning"><b>Meaning:</b> ${esc(it.m)}</div>
      ${soundRow(false, true)}
      <div class="hint-line">💡 ${esc(L.title)}: ${esc(L.tip)}</div>
    </div>`;
  renderLetters();
  Voice.say(sayText(it));
};

STAGE.scramble = it => {
  let order;
  const idx = it.letters.map((_, i) => i);
  for (let tries = 0; tries < 20; tries++) {
    order = shuffle(idx.slice());
    if (order.map(i => it.letters[i]).join("") !== it.plain) break;
  }
  G.tiles = order.map(i => ({ ch: it.letters[i], used: false }));
  $("#stage").innerHTML = `
    <div class="play-card">
      <div class="instruction">🔀 Unscramble the letters</div>
      ${picHTML(it)}
      <div class="tiles-row" id="tiles">${G.tiles.map((t, i) => `<div class="ltile" data-i="${i}" style="background:${TILE_COLORS[i % TILE_COLORS.length]};animation-delay:${i * 0.04}s">${esc(t.ch)}</div>`).join("")}</div>
      <div class="meaning"><b>Clue:</b> ${esc(it.m)}</div>
      ${boxesHTML(it)}
      ${soundRow(false, false)}
      <div class="hint-line">Stuck? Tap 🔊 to hear the word.</div>
    </div>`;
  renderLetters();
};
function renderTiles() {
  // recompute which tiles are used from the typed letters
  G.tiles.forEach(t => (t.used = false));
  G.typed.forEach(ch => { if (!ch) return; const t = G.tiles.find(t => !t.used && t.ch === ch); if (t) t.used = true; });
  $$("#tiles .ltile").forEach((el, i) => el.classList.toggle("used", G.tiles[i].used));
}

STAGE.test = it => {
  const recall = it.g === "gre";  // GRE: recall the word from its meaning — don't say it
  const intro = recall ? "🧠 Which word fits? Type it" : G.mode === "tricky" ? "🧠 Spell the tricky word" : G.mode === "review" ? "🎲 Review: listen and spell" : "🐝 Listen and spell the word";
  $("#stage").innerHTML = `
    <div class="play-card">
      <div class="instruction">${intro}</div>
      ${picHTML(it)}
      ${recall ? "" : soundRow(true, true)}
      <div class="sentence">${sentenceHTML(it, "blank")}</div>
      <div class="meaning"><b>Meaning:</b> ${it.pos ? `<i>(${esc(it.pos)})</i> ` : ""}${esc(it.m)}</div>
      ${boxesHTML(it)}
      <div id="correction"></div>
      <div class="check-row" id="checkRow"><button class="btn mint" id="checkBtn" data-act="check" disabled>✓ Check</button><span class="hint-line">Type it, then press <kbd>Enter</kbd> · <kbd>space</kbd> = ${recall ? "hear it (hint)" : "hear again"} · <kbd>⌫</kbd> = fix</span></div>
    </div>`;
  renderLetters();
  if (!recall) speakCurrent(false);
};

STAGE.balloon = it => {
  const g = it.g || 3;
  const colors = ["#FF3D7A", "#3797FF", "#48D4AE", "#C59AFF", "#FF8A80", "#FFB020"];
  const color = colors[G.idx % colors.length];
  $("#stage").innerHTML = `
    <div class="balloon-sky" id="sky">
      <div class="cloud" style="width:120px;height:34px;top:18%;animation-duration:38s;animation-delay:-8s"></div>
      <div class="cloud" style="width:90px;height:26px;top:48%;animation-duration:52s;animation-delay:-30s"></div>
      <div class="cloud" style="width:150px;height:40px;top:70%;animation-duration:44s;animation-delay:-18s"></div>
      <div class="balloon" id="bln">
        <div class="look-tag" id="lookTag">${it.e ? it.e + " " : "👀 "}Look! Remember it!</div>
        <div class="bbody" id="bbody" style="background:${color}">${esc(it.d || it.plain)}</div>
        <div class="knot" style="color:${color};border-bottom-color:${color}"></div>
        <div class="string"></div>
      </div>
    </div>`;
  G.flashing = true;
  G.frac = 0;
  const factor = { tk: 2.2, k: 1.7, 2: 1.4, 3: 1.2, 4: 1.05, 5: 0.95, gre: 0.95 }[g] || 1;
  G.riseDur = (5200 + it.letters.length * 1000) * factor;
  G.flashMs = 1300 + it.letters.length * 170;
  positionBalloon();
  Voice.say(sayText(it));
  later(endFlash, G.flashMs);
};
function endFlash() {
  if (!G || !G.flashing) return;
  G.flashing = false;
  const tag = $("#lookTag"); if (tag) tag.remove();
  renderBalloonText();
  G.riseStart = performance.now() - G.frac * G.riseDur;
  const g = G;
  const loop = t => {
    if (G !== g || G.phase !== "play") return;
    G.frac = Math.min(1, (t - G.riseStart) / G.riseDur);
    positionBalloon();
    if (G.frac >= 1) return balloonEscaped();
    G.raf = requestAnimationFrame(loop);
  };
  G.raf = requestAnimationFrame(loop);
}
function positionBalloon() {
  const sky = $("#sky"), b = $("#bln");
  if (!sky || !b) return;
  const travel = Math.max(40, sky.clientHeight - b.offsetHeight + 60);
  b.style.transform = `translate(-50%, ${-G.frac * travel}px)`;
}
function renderBalloonText() {
  const body = $("#bbody");
  if (!body || G.flashing) return;
  const it = cur();
  body.innerHTML = it.letters.map((ch, i) => (G.typed[i] ? `<span class="slot">${esc(G.typed[i])}</span>` : `<span class="slot empty"></span>`)).join("");
}
function balloonEscaped() {
  const it = cur();
  G.phase = "done"; G.locked = true;
  G.lives--; G.combo = 0;
  Sound.whoosh();
  $("#bln").classList.add("gone");
  G.results[G.idx] = { it, ok: false, wm: G.wm };
  addTricky(it);
  const msg = document.createElement("div");
  msg.className = "reveal-msg";
  msg.innerHTML = `Whoosh! It floated away.<br>The word was <span class="cw">${wordHTML(it)}</span>`;
  $("#stage").appendChild(msg);
  KB.setNext(null);
  renderPips();
  Voice.say([SPOKEN.wordWas, sayText(it), ...Voice.letters(it.plain)]);
  later(() => { G.idx++; loadWord(); }, 2600);
}

/* ----- key handling ----- */
function gameKey(k) {
  if (!G || G.locked) return;
  if (G.mc) return mcKey(k);
  if (k === " ") { speakCurrent(false); return; }
  if (G.mode === "balloon" && G.flashing && /^[a-z']$/.test(k)) endFlash();
  if (G.free && G.phase === "play") return freeKey(k);
  if (!/^[a-z']$/.test(k)) return;
  strictKey(k);
}

function strictKey(k) {
  const it = cur();
  if (G.pos >= it.letters.length) return;
  const exp = it.letters[G.pos];
  if (k === exp) {
    G.typed[G.pos] = k;
    KB.flash(k, true);
    Sound.letter(G.note++);
    G.lm = 0;
    G.pos = nextPos(G.pos + 1);
    renderLetters();
    if (G.pos >= it.letters.length) strictComplete();
    else updateHint();
  } else {
    if (G.phase !== "fix") { G.wm++; G.mistakes++; }
    G.lm++;
    if (G.mode === "balloon") G.combo = 0;
    KB.flash(k, false);
    Sound.wrong();
    shakeBoxes(false);
    updateHint();
  }
}

function strictComplete() {
  const it = cur();
  G.locked = true;
  KB.setNext(null);
  if (G.mode === "learn" && G.step === 0) {
    $("#boxes").classList.add("win");
    Sound.word();
    later(() => {
      G.step = 1; G.lm = 0; G.locked = false;
      G.typed = it.letters.map(() => null);
      G.pos = nextPos(0);
      STAGE.learn(it);
      if (LITTLE.has(it.g)) Voice.say(SPOKEN.coverIt);
      updateHint();
    }, 800);
    return;
  }
  if (G.phase === "fix") {
    $("#boxes").classList.add("win");
    Sound.word();
    praise(pick(["Now you've got it!", "That's it!", "Good fixing!"]));
    later(() => { G.idx++; loadWord(); }, 1100);
    return;
  }
  if (G.mode === "balloon") {
    if (G.raf) cancelAnimationFrame(G.raf);
    G.phase = "done";
    const b = $("#bln");
    b.classList.add("popped");
    b.querySelector(".string").style.opacity = "0";
    Sound.pop();
    confettiAt($("#bbody"), 34, 1);
    G.combo++;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    const pts = Math.round((10 * it.letters.length + Math.round((1 - G.frac) * 50)) * (1 + Math.min(G.combo - 1, 5) * 0.2));
    G.score += pts;
    praise(`+${pts}${G.combo >= 3 ? ` 🔥x${G.combo}` : ""}`);
  } else {
    $("#boxes").classList.add("win");
    Sound.word();
    confettiAt($("#boxes"), G.wm === 0 ? 22 : 10, 0.7);
    praise(G.wm === 0 ? pick(PRAISE_GREAT) : pick(PRAISE_OK));
  }
  const ok = G.wm <= 1;
  G.results[G.idx] = { it, ok, wm: G.wm };
  if (G.wm >= 2) addTricky(it);
  renderPips();
  if (LITTLE.has(it.g)) Voice.say(pick(SPOKEN.praise));
  else if (G.mode === "learn" || G.mode === "gap") Voice.say(sayText(it));
  later(() => { G.idx++; loadWord(); }, G.mode === "balloon" ? 900 : 1000);
}

function freeKey(k) {
  const it = cur(), len = it.letters.length;
  if (k === "Backspace") { if (G.input.length) { G.input.pop(); Sound.click(); } renderLetters(); return; }
  if (k === "Enter") {
    if (G.input.length === len) checkFree();
    else { Sound.wrong(); shakeBoxes(true); }
    return;
  }
  if (!/^[a-z']$/.test(k)) return;
  if (G.input.length >= len) { Sound.wrong(); shakeBoxes(true); return; }
  G.input.push(k);
  KB.flash(k, true);
  Sound.letter(G.input.length - 1);
  renderLetters();
}

function checkFree() {
  const it = cur(), p = P();
  const ans = G.input.join("");
  G.locked = true;
  if (ans === it.plain) {
    $("#boxes").classList.add("win");
    Sound.word();
    confettiAt($("#boxes"), 26, 0.8);
    G.combo++;
    G.bestCombo = Math.max(G.bestCombo, G.combo);
    p.stats.streak++;
    p.stats.bestStreak = Math.max(p.stats.bestStreak, p.stats.streak);
    p.stats.mastered[it.plain] = 1;
    let extra = "";
    if (G.mode === "tricky" && p.tricky[it.plain]) {
      const t = p.tricky[it.plain];
      t.streak = (t.streak || 0) + 1;
      if (t.streak >= 2) { delete p.tricky[it.plain]; p.stats.trickyDone++; extra = " Tamed! 🦁"; }
      else extra = " One more time to tame it!";
    }
    save();
    praise(pick(PRAISE_GREAT) + (G.combo >= 3 ? ` 🔥${G.combo}` : ""));
    G.results[G.idx] = { it, ok: true, wm: 0 };
    renderPips();
    if (LITTLE.has(it.g)) Voice.say(pick(SPOKEN.praise));
    if (extra) $("#correction").innerHTML = `<div class="correction">${extra}</div>`;
    later(() => { G.idx++; loadWord(); }, 1200);
    return;
  }
  // wrong: show the right spelling, then type it once correctly
  Sound.uhoh();
  G.combo = 0;
  p.stats.streak = 0;
  G.results[G.idx] = { it, ok: false, wm: 1 };
  addTricky(it, true);
  renderPips();
  $$("#boxes .box").forEach((b, i) => { b.className = "box " + (G.input[i] === it.letters[i] ? "right" : "wrong"); });
  shakeBoxes(true);
  const L = lesson(it.g, it.li);
  $("#correction").innerHTML = `<div class="correction">Almost! You typed <b>${esc(ans)}</b>. Here's how to spell it:
    <span class="cw">${wordHTML(it)}</span>💡 <b>${esc(L.title)}:</b> ${esc(L.tip)}</div>`;
  $("#checkRow").innerHTML = `<span class="hint-line">Now type it correctly to keep going ✍️</span>`;
  Voice.say([SPOKEN.almost, ...Voice.letters(it.plain), sayText(it)]);
  later(() => {
    G.phase = "fix"; G.locked = false;
    G.typed = it.letters.map(() => null);
    G.given = it.letters.map(() => false);
    G.pos = 0; G.lm = 0;
    renderLetters();
    updateHint();
  }, 1800);
}

function addTricky(it, reset) {
  const p = P();
  if (!p) return;
  const t = p.tricky[it.plain];
  if (t) { if (reset) t.streak = 0; }
  else p.tricky[it.plain] = { g: it.g, li: it.li, wi: it.wi, streak: 0, added: Date.now() };
  save();
}

/* ----- multiple choice: Meaning Match, Text Completion, Sentence Equivalence ----- */
function mcItems(mode, g, li) {
  const L = lesson(g, li);
  if (mode === "tc") return L.tc.map(q => ({ kind: "tc", q, g, li }));
  if (mode === "se") return L.se.map(q => ({ kind: "se", q, g, li }));
  // Meaning Match: distractors come from OTHER lessons (same-cluster words have near-identical meanings)
  const others = DATA[g].lessons.filter((_, i) => i !== li).flatMap(x => x.items);
  return shuffle(L.items.slice()).map(it => {
    const bad = new Set([it.plain, ...(it.syn || [])]);
    const same = shuffle(others.filter(o => o.pos === it.pos && !bad.has(o.plain)));
    const rest = shuffle(others.filter(o => !bad.has(o.plain)));
    const ds = [...new Set([...same, ...rest].map(o => o.plain))].slice(0, 4);
    const choices = shuffle([it.plain, ...ds]);
    return { kind: "match", it, g, li, q: { choices, answer: [choices.indexOf(it.plain)] } };
  });
}
const ROMAN = ["i", "ii", "iii"];
function mcCols(item) { return item.kind === "tc" ? item.q.blanks : [item.q.choices]; }
function mcBlankify(text) {
  let h = esc(text);
  h = h.replace(/\((i{1,3})\) _____/g, (_, r) => `<span class="mc-blank" data-b="${ROMAN.indexOf(r)}">(${r}) ________</span>`);
  return h.replace(/_____/g, `<span class="mc-blank" data-b="0">________</span>`);
}
STAGE.mc = item => {
  const q = item.q, cols = mcCols(item);
  const opts = (choices, col) => `<div class="mc-opts">${choices.map((c, i) =>
    `<button class="mc-opt ${item.kind === "se" ? "check" : ""}" data-act="mcPick" data-col="${col}" data-i="${i}"><span class="mc-key">${col * 3 + i + 1}</span><span>${esc(c)}</span></button>`).join("")}</div>`;
  let head, body;
  if (item.kind === "match") {
    head = `<div class="instruction">🎯 Which word means…</div><div class="mc-q def">${esc(item.it.m)} <span class="mc-pos">(${esc(item.it.pos || "")})</span></div>`;
    body = opts(q.choices, 0);
  } else if (item.kind === "tc") {
    const multi = q.blanks.length > 1;
    head = `<div class="instruction">📝 Text Completion · ${multi ? "choose one entry for each blank" : "choose the one entry that best completes the text"}</div><div class="mc-q">${mcBlankify(q.q)}</div>`;
    body = multi ? `<div class="mc-cols">${q.blanks.map((b, j) => `<div class="mc-col"><div class="mc-colh">Blank (${ROMAN[j]})</div>${opts(b, j)}</div>`).join("")}</div>` : opts(q.blanks[0], 0);
  } else {
    head = `<div class="instruction">⚖️ Sentence Equivalence · select the TWO answers that complete the sentence and give it the same meaning</div><div class="mc-q">${mcBlankify(q.q)}</div>`;
    body = opts(q.choices, 0);
  }
  const n = cols.reduce((a, c) => a + c.length, 0);
  $("#stage").innerHTML = `
    <div class="play-card mc-card">
      ${head}${body}
      <div id="mcWhy"></div>
      <div class="check-row" id="checkRow">${item.kind === "match" ? "" : `<button class="btn mint" id="checkBtn" data-act="mcCheck" disabled>✓ Check</button>`}
        <span class="hint-line">Keys <kbd>1</kbd>–<kbd>${Math.min(n, 9)}</kbd> choose${item.kind === "match" ? "" : " · <kbd>Enter</kbd> checks"}</span></div>
    </div>`;
  // two-blank columns are numbered 1-3 and 4-6
  if (item.kind === "tc" && q.blanks.length > 1) $$(".mc-col").forEach((c, j) => $$(".mc-key", c).forEach((k, i) => (k.textContent = j * 3 + i + 1)));
  else $$(".mc-key").forEach((k, i) => (k.textContent = i + 1));
};
function mcRender() {
  const item = cur();
  $$(".mc-opt").forEach(b => {
    const col = +b.dataset.col, i = +b.dataset.i;
    b.classList.toggle("sel", item.kind === "se" ? G.sel.includes(i) : G.sel[col] === i);
  });
  if (item.kind === "tc") $$(".mc-blank").forEach(sp => {
    const j = +sp.dataset.b, v = G.sel[j];
    sp.textContent = v === undefined || v === null ? (item.q.blanks.length > 1 ? `(${ROMAN[j]}) ________` : "________") : item.q.blanks[j][v];
    sp.classList.toggle("filled", v !== undefined && v !== null);
  });
  const cb = $("#checkBtn");
  if (cb) {
    const ready = item.kind === "se" ? G.sel.length === 2 : mcCols(item).every((_, j) => G.sel[j] !== undefined && G.sel[j] !== null);
    cb.disabled = !ready;
    cb.classList.toggle("speaking", ready);
  }
}
function mcPick(col, i) {
  if (!G || G.phase !== "play") return;
  const item = cur();
  if (item.kind === "se") {
    const at = G.sel.indexOf(i);
    if (at >= 0) G.sel.splice(at, 1);
    else { G.sel.push(i); if (G.sel.length > 2) G.sel.shift(); }
  } else G.sel[col] = i;
  Sound.click();
  mcRender();
  if (item.kind === "match") mcCheck();
}
ACT.mcPick = el => mcPick(+el.dataset.col, +el.dataset.i);
function mcCheck() {
  if (!G || G.phase !== "play") return;
  const item = cur(), q = item.q;
  let ok;
  if (item.kind === "se") ok = G.sel.length === 2 && [...G.sel].sort().join() === [...q.answer].sort().join();
  else ok = q.answer.every((a, j) => G.sel[j] === a);
  if (item.kind !== "se" && !mcCols(item).every((_, j) => G.sel[j] !== undefined && G.sel[j] !== null)) return;
  G.phase = "review";
  // mark every option
  $$(".mc-opt").forEach(b => {
    const col = +b.dataset.col, i = +b.dataset.i;
    const right = item.kind === "se" ? q.answer.includes(i) : q.answer[col] === i;
    const picked = item.kind === "se" ? G.sel.includes(i) : G.sel[col] === i;
    b.classList.toggle("right", right);
    b.classList.toggle("wrong", picked && !right);
    b.disabled = true;
  });
  // the correct words, for the results list and the tricky-words list
  const words = item.kind === "match" ? [item.it.plain]
    : item.kind === "se" ? q.answer.map(a => q.choices[a]) : q.answer.map((a, j) => q.blanks[j][a]);
  const L = lesson(item.g, item.li);
  const lessonWords = words.map(w => L.items.find(it => it.plain === w)).filter(Boolean);
  if (ok) { Sound.word(); G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); praise(pick(PRAISE_GREAT)); confettiAt($("#checkRow"), 18, 0.6); }
  else { Sound.uhoh(); G.combo = 0; G.mistakes++; lessonWords.forEach(it => addTricky(it)); }
  G.results[G.idx] = { ok, label: words.join(" / "), it: item.it || lessonWords[0] || null };
  renderPips();
  let why = q.why ? esc(q.why) : "";
  if (item.kind === "match") {
    const it = item.it;
    why = `<b>${esc(it.plain)}</b> <i>(${esc(it.pos || "")})</i>: ${esc(it.m)}.${it.syn ? ` <b>Synonyms:</b> ${esc(it.syn.join(", "))}.` : ""} <i>“${sentenceHTML(it, "hl")}”</i>`;
    Voice.say(sayText(it));
  }
  $("#mcWhy").innerHTML = `<div class="correction mc-why">${ok ? "✅ <b>Correct!</b>" : `❌ <b>Not quite.</b> Answer: <b>${esc(words.join(" · "))}</b>.`} ${why}</div>`;
  $("#checkRow").innerHTML = `<button class="btn pink" id="nextBtn" data-act="mcNext">Next ▶</button><span class="hint-line"><kbd>Enter</kbd> for next</span>`;
}
ACT.mcCheck = () => mcCheck();
ACT.mcNext = () => { if (G && G.phase === "review") { G.idx++; loadWord(); } };
function mcKey(k) {
  const item = cur();
  if (k === "Enter") return G.phase === "review" ? ACT.mcNext() : mcCheck();
  if (!/^[1-9]$/.test(k) || G.phase !== "play") return;
  const n = +k - 1;
  if (item.kind === "tc" && item.q.blanks.length > 1) { const col = Math.floor(n / 3), i = n % 3; if (col < item.q.blanks.length) mcPick(col, i); }
  else if (n < mcCols(item)[0].length) mcPick(0, n);
}

/* ----- finishing ----- */
function computeStars() {
  const n = G.items.length;
  const right = G.results.filter(r => r && r.ok).length;
  switch (G.mode) {
    case "learn": return G.mistakes <= 1 ? 3 : G.mistakes <= 5 ? 2 : 1;
    case "gap": return G.mistakes <= 1 ? 3 : G.mistakes <= 4 ? 2 : 1;
    case "scramble": return G.mistakes <= 2 ? 3 : G.mistakes <= 6 ? 2 : 1;
    case "balloon": return [3, 2, 1, 0][Math.min(3, 3 - G.lives)]; // one star lost per balloon that floats away
    default: return right >= n * 0.9 ? 3 : right >= n * 0.7 ? 2 : right >= n * 0.5 ? 1 : 0;
  }
}

function finishGame() {
  const p = P();
  const g = G;
  if (g.raf) cancelAnimationFrame(g.raf);
  KB.setNext(null);
  const stars = FREE.has(g.mode) && g.mode !== "test" ? null : computeStars();
  const st = p.stats;
  st.games++;
  if (!st.days.includes(today())) st.days.push(today());
  if (!FREE.has(g.mode) || g.mode === "test") st.types[g.mode] = 1;
  if (g.mode === "learn" && g.mistakes === 0) st.learnPerfect++;
  if (g.mode === "balloon" && g.lives === 3) st.perfectBalloon++;
  if (g.mode === "review") st.reviews++;
  let unlocked = false, prevBest = 0;
  if (g.cfg.g) {
    const r = prog(p, g.cfg.g, g.cfg.li);
    prevBest = r[g.mode] || 0;
    if (g.mode === "test" && prevBest < 1 && stars >= 1 && g.cfg.li + 1 < DATA[g.cfg.g].lessons.length && !DB.settings.unlockAll) unlocked = true;
    r[g.mode] = Math.max(prevBest, stars || 0);
    p.last = { g: g.cfg.g, li: g.cfg.li };
  }
  const newBadges = checkBadges(p);
  save();
  const results = g.results.slice();
  const secs = Math.round((Date.now() - g.start) / 1000);
  const right = results.filter(r => r && r.ok).length;
  const mode = g.mode, cfg = g.cfg, score = g.score, mistakes = g.mistakes, lives = g.lives, total = g.items.length;
  stopGame();
  keyHandler = null;
  current = { name: "results", args: [] };

  const head = stars === null ? (right >= total * 0.8 ? "Great practice!" : "Good practice!")
    : ["Keep practicing!", "Nice work!", "Great job!", "Amazing!"][stars];
  let msg;
  if (mode === "test") msg = stars >= 1 ? (unlocked ? `🔓 You unlocked <b>Lesson ${cfg.li + 2}: ${esc(lesson(cfg.g, cfg.li + 1).title)}</b>!` : `You passed the ${gameInfo("test", cfg.g).name}!`) : `You need ${Math.ceil(total / 2)} words right to pass. Try <b>Look & Learn</b> and <b>Fill the Gap</b> again, then come back!`;
  else if (mode === "balloon" && lives <= 0) msg = "The balloons got away this time. Try again — you'll get faster!";
  else if (mode === "tricky") msg = `Spell a tricky word right twice to tame it. ${Object.keys(p.tricky).length} tricky word${Object.keys(p.tricky).length === 1 ? "" : "s"} left.`;
  else if (stars !== null && stars < 3) msg = "Play again to earn more stars!";
  else msg = "You're becoming a super speller!";

  const statBoxes = [];
  if (mode === "balloon") statBoxes.push([score, "points"], [results.filter(Boolean).length - (3 - lives), "balloons popped"]);
  else if (FREE.has(mode)) statBoxes.push([`${right}/${total}`, "right first try"]);
  else if (MC.has(mode)) statBoxes.push([`${right}/${total}`, "correct"]);
  else statBoxes.push([`${right}/${total}`, "words with ≤1 slip"], [mistakes, "slips"]);
  statBoxes.push([secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`, "time"]);

  const chips = results.map((r, i) => r ? `<span class="wr ${r.ok ? "ok" : "miss"}" data-act="sayResult" data-i="${i}">${r.ok ? "✓" : "✗"} ${esc(r.label || r.it.plain)}</span>` : "").join("");
  const LG = cfg.g ? lessonGames(lesson(cfg.g, cfg.li)) : [];
  const nextG = cfg.g ? LG[LG.findIndex(x => x.id === mode) + 1] : null;
  const nextBtn = cfg.g
    ? (mode === "test" && stars >= 1 && cfg.li + 1 < DATA[cfg.g].lessons.length
      ? `<button class="btn big pink" data-act="nextLesson">Next lesson ▶</button>`
      : nextG ? `<button class="btn big pink" data-act="playNext" data-mode="${nextG.id}">Next: ${nextG.icon} ${nextG.name} ▶</button>` : "")
    : "";
  RESULT_CTX = { mode, cfg, results };
  app.innerHTML = `
    <div class="screen results-screen" style="background:${cfg.g ? WORLD[cfg.g].light : "#FFF7D6"}">
      <div class="card results-card">
        <div style="font-size:54px">${gameInfo(mode, cfg.g).icon}</div>
        <h1>${head}</h1>
        ${stars !== null ? `<div class="big-stars">${[0, 1, 2].map(i => `<span class="star ${i < stars ? "" : "off"}" style="animation-delay:${0.3 + i * 0.35}s">★</span>`).join("")}</div>` : ""}
        <div style="font-size:19px">${msg}</div>
        <div class="stats">${statBoxes.map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join("")}</div>
        <div class="word-results">${chips}</div>
        <div class="fact">🦉 <b>Did you know?</b> ${pick(FACTS)}</div>
        <div class="results-actions">
          <button class="btn" data-act="playAgain">🔁 Play again</button>
          ${nextBtn}
          <button class="btn" data-act="${cfg.g ? "backToLessonFromResults" : "toHome"}">${cfg.g ? "📚 Lesson" : "🏠 Home"}</button>
        </div>
      </div>
    </div>`;
  // celebration
  if (stars !== null) {
    for (let i = 0; i < stars; i++) setTimeout(() => Sound.star(i), 300 + i * 350);
    if (stars >= 1) setTimeout(() => { Sound.fanfare(); confetti(innerWidth / 2, innerHeight / 3, 60 + stars * 30, 1.6); }, 300 + stars * 350);
    else setTimeout(() => Sound.uhoh(), 300);
  } else { Sound.bigWin(); confetti(innerWidth / 2, innerHeight / 3, 70, 1.4); }
  if (unlocked) setTimeout(() => Sound.unlock(), 1800);
  if (newBadges.length) setTimeout(() => toastQueue(newBadges), 1600);
  keyHandler = k => { if (k === "Enter") { const b = $(".results-actions .pink") || $(".results-actions .btn"); b && b.click(); } };
}
let RESULT_CTX = null;
ACT.sayResult = el => { const r = RESULT_CTX.results[+el.dataset.i]; if (r && r.it && r.it.plain) Voice.say([sayText(r.it), r.it.s]); };
ACT.playAgain = () => {
  const { mode, cfg } = RESULT_CTX;
  if (mode === "tricky") return ACT.startTricky();
  if (mode === "review") return ACT.startReview();
  startGame(mode, cfg);
};
ACT.playNext = el => startGame(el.dataset.mode, RESULT_CTX.cfg);
ACT.nextLesson = () => { const { cfg } = RESULT_CTX; go("lesson", cfg.g, cfg.li + 1); };
ACT.backToLessonFromResults = () => { const { cfg } = RESULT_CTX; go("lesson", cfg.g, cfg.li); };

function checkBadges(p) {
  const st = p.stats;
  const tests = [];
  for (const k in p.progress) tests.push(p.progress[k].test || 0);
  const mastered = Object.keys(st.mastered).length;
  const stars = totalStars(p);
  const allPassed = g => DATA[g].lessons.every((_, li) => (progR(p, g, li).test || 0) >= 1);
  const days = st.days.length;
  const earned = {
    first: st.games >= 1,
    learn0: st.learnPerfect >= 1,
    test1: tests.some(t => t >= 1),
    perfect: tests.some(t => t >= 3),
    perfect5: tests.filter(t => t >= 3).length >= 5,
    alltypes: KID_GAMES.every(id => st.types[id]),
    balloon: st.perfectBalloon >= 1,
    combo: st.bestStreak >= 10,
    review: st.reviews >= 1,
    tricky5: st.trickyDone >= 5,
    tricky25: st.trickyDone >= 25,
    w25: mastered >= 25, w100: mastered >= 100, w250: mastered >= 250, wall: mastered >= TOTAL_WORDS,
    stars50: stars >= 50, stars200: stars >= 200,
    ...Object.fromEntries(GRADES.map(g => ["g" + g, allPassed(g)])),
    days3: days >= 3, days7: days >= 7, days30: days >= 30,
  };
  const fresh = [];
  for (const b of BADGES) if (earned[b.id] && !p.badges[b.id]) { p.badges[b.id] = Date.now(); fresh.push(b); }
  return fresh;
}

/* ---------------- boot ---------------- */
applySettings();
go("title");
