// Collect every line the app can speak, as JSON: [{id, text, slow}]
// Usage: node tools/collect_texts.js > clips.json
// The id hash MUST match clipId() in public/audio.js.
const path = require("path");
const PUB = path.join(__dirname, "..", "public");
global.window = {};
for (const f of ["gtk", "gk", "g2", "g3", "g4", "g5", "ggre"]) require(path.join(PUB, "words", f + ".js"));
require(path.join(PUB, "phrases.js"));

function clipId(text, slow) {
  const s = text.trim() + (slow ? "|slow" : "");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
const plain = w => w.replace(/[\[\]]/g, "");
const sayText = (w, say) => say || (plain(w).length === 1 ? plain(w).toUpperCase() : plain(w));

const out = new Map();
// rtm = spoken by "Read it to me" (recorded in the read-aloud voice too)
let LV = "";  // level currently being collected; a line shared by several levels lists them all
const add = (text, slow = false, kind = "line", rtm = false) => {
  if (!text) return;
  const id = clipId(text, slow);
  const prev = out.get(id);
  if (prev && prev.text !== text.trim()) throw new Error(`hash collision: "${prev.text}" vs "${text}"`);
  if (prev) {
    prev.rtm = prev.rtm || rtm;
    if (kind !== "lesson") prev.kind = kind;
    if (LV && !prev.levels.includes(LV)) prev.levels.push(LV);
    return;
  }
  out.set(id, { id, text: text.trim(), slow, kind, rtm, levels: LV ? [LV] : [] });
};

for (const [lv, d] of Object.entries(window.SPELLING_DATA)) {
  LV = lv;
  for (const L of d.lessons) {
    add(L.title, false, "lesson", true); add(L.rule, false, "lesson", true); add(L.tip, false, "lesson", true);
    for (const e of L.examples || []) { add(sayText(e), false, "word", true); add(sayText(e), true, "word"); }
    for (const x of L.words) {
      add(sayText(x.w, x.say), false, "word");
      add(sayText(x.w, x.say), true, "word");
      add(x.s, false, "sentence");
    }
  }
}
LV = "";
for (const v of Object.values(window.SPOKEN)) (Array.isArray(v) ? v : [v]).forEach(t => add(t));
for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") add(c, false, "word");

if (require.main === module) process.stdout.write(JSON.stringify([...out.values()]));
module.exports = { clipId };
