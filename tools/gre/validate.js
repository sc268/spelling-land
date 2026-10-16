// Validate GRE part files. Usage: node validate.js part1.json [part2.json ...]
const fs = require("fs");
let bad = [], seen = {};
for (const f of process.argv.slice(2)) {
  const L = JSON.parse(fs.readFileSync(f, "utf8"));
  if (!Array.isArray(L)) { bad.push(f + ": not an array"); continue; }
  for (const l of L) {
    const tag = `${f}#${l.n} ${l.title}`;
    for (const k of ["n", "title", "icon", "rule", "tip", "examples", "words", "tc", "se"]) if (l[k] === undefined) bad.push(`${tag}: missing ${k}`);
    if ((l.words || []).length !== 12) bad.push(`${tag}: ${(l.words || []).length} words (need 12)`);
    for (const x of l.words || []) {
      const p = (x.w || "").replace(/[\[\]]/g, "");
      if (!/^[a-z\[\]]+$/.test(x.w || "") || !/\[[a-z]+\]/.test(x.w)) bad.push(`${tag}: bad w "${x.w}"`);
      if (!["adj", "noun", "verb", "adv"].includes(x.pos)) bad.push(`${tag}: ${p} bad pos ${x.pos}`);
      if (!x.m || x.m.split(/\s+/).length > 14 || new RegExp(`\\b${p}\\b`, "i").test(x.m)) bad.push(`${tag}: ${p} bad m`);
      const hits = (x.s || "").match(new RegExp(`(^|[^a-z])${p}([^a-z]|$)`, "gi")) || [];
      if (hits.length !== 1) bad.push(`${tag}: ${p} must appear exactly once in s (found ${hits.length})`);
      const wc = (x.s || "").split(/\s+/).length; if (wc < 12 || wc > 34) bad.push(`${tag}: ${p} sentence length ${wc}`);
      if (!Array.isArray(x.syn) || x.syn.length < 2) bad.push(`${tag}: ${p} needs 2+ syn`);
      if (!Array.isArray(x.ant)) bad.push(`${tag}: ${p} ant must be an array`);
      if (!x.root) bad.push(`${tag}: ${p} missing root`);
      if (seen[p]) bad.push(`${tag}: duplicate word ${p} (also in ${seen[p]})`); seen[p] = tag;
    }
    for (const e of l.examples || []) if (!(l.words || []).some(x => x.w === e)) bad.push(`${tag}: example ${e} not one of the words`);
    const lw = new Set((l.words || []).map(x => x.w.replace(/[\[\]]/g, "")));
    const tc = l.tc || [];
    if (tc.length !== 4) bad.push(`${tag}: ${tc.length} tc (need 4)`);
    if (tc.filter(q => (q.blanks || []).length === 1).length !== 2) bad.push(`${tag}: need 2 single-blank tc`);
    tc.forEach((q, i) => {
      const nb = (q.blanks || []).length;
      if (!(nb === 1 || nb === 2)) return bad.push(`${tag}: tc${i} blanks`);
      if (nb === 1 && ((q.q.match(/_____/g) || []).length !== 1 || q.blanks[0].length !== 5)) bad.push(`${tag}: tc${i} single blank needs one _____ and 5 options`);
      if (nb === 2 && (!/\(i\) _____/.test(q.q) || !/\(ii\) _____/.test(q.q) || q.blanks.some(b => b.length !== 3))) bad.push(`${tag}: tc${i} double blank needs (i) _____ (ii) _____ and 3+3 options`);
      if (!Array.isArray(q.answer) || q.answer.length !== nb || q.answer.some((a, j) => !(a >= 0 && a < q.blanks[j].length))) bad.push(`${tag}: tc${i} bad answer`);
      else if (!q.answer.some((a, j) => lw.has(q.blanks[j][a]))) bad.push(`${tag}: tc${i} no lesson word among the correct answers`);
      if (!q.why) bad.push(`${tag}: tc${i} missing why`);
    });
    const se = l.se || [];
    if (se.length !== 4) bad.push(`${tag}: ${se.length} se (need 4)`);
    se.forEach((q, i) => {
      if ((q.q.match(/_____/g) || []).length !== 1) bad.push(`${tag}: se${i} needs exactly one _____`);
      if (!Array.isArray(q.choices) || q.choices.length !== 6) bad.push(`${tag}: se${i} needs 6 choices`);
      if (!Array.isArray(q.answer) || q.answer.length !== 2 || q.answer[0] === q.answer[1] || q.answer.some(a => !(a >= 0 && a < 6))) bad.push(`${tag}: se${i} bad answer`);
      else if (!q.answer.some(a => lw.has(q.choices[a]))) bad.push(`${tag}: se${i} no lesson word among the correct answers`);
      if (!q.why) bad.push(`${tag}: se${i} missing why`);
    });
  }
}
console.log(bad.length ? bad.join("\n") : "OK");
process.exit(bad.length ? 1 : 0);
