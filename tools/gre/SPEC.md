# GRE Verbal curriculum — part spec

Audience: college / graduate students preparing for the real GRE General Test (Verbal Reasoning).
Goal: master high-frequency GRE vocabulary AND practice the two GRE vocabulary question types
(Text Completion, Sentence Equivalence) at genuine ETS difficulty — NOT toy examples.

## The 30 lessons (meaning clusters). Each writer only writes its own 6, but must respect these boundaries
1 Praise & Acclaim · 2 Criticism & Rebuke · 3 Flattery & Servility · 4 Arrogance & Disdain · 5 Humility & Restraint ·
6 Insolence & Irreverence · 7 Stubbornness & Obstinacy · 8 Compliance & Docility · 9 Honesty & Candor ·
10 Deception & Trickery · 11 Generosity & Benevolence · 12 Stinginess & Greed · 13 Wordiness & Bombast ·
14 Brevity & Reticence · 15 Clarity & Lucidity · 16 Obscurity & Complexity · 17 Banality & Cliché ·
18 Originality & Unorthodoxy · 19 Lessen & Pacify · 20 Worsen & Provoke · 21 Excess & Abundance ·
22 Scarcity & Poverty · 23 Fleeting & Fickle · 24 Permanent & Entrenched · 25 Hostility & Aggression ·
26 Calm & Composure · 27 Caution vs. Rashness · 28 Diligence vs. Idleness · 29 Skill vs. Ineptitude ·
30 Support vs. Undermine (argument & evidence)

## Output: a JSON file = array of 6 lesson objects, exactly this shape
{
  "n": 1,                                   // lesson number from the list above
  "title": "Praise & Acclaim",
  "icon": "👏",                              // one emoji
  "rule": "...",   // 2 sentences: what this cluster means + how the GRE tends to test it (signal words, common traps)
  "tip": "...",    // 1 sentence: a memorable root/mnemonic/strategy for this cluster
  "examples": ["la[u]d", "e[x]tol"],         // 2-3 of the lesson's words in bracket format
  "words": [ 12 word objects ],
  "tc": [ 4 Text Completion questions ],
  "se": [ 4 Sentence Equivalence questions ]
}

### word object
{ "w": "obs[equ]ious",          // lowercase a-z only + square brackets around the hardest-to-spell part (>=1 bracket group);
                                // removing brackets gives the correct American spelling. Use the base/dictionary form.
  "pos": "adj",                 // one of: adj, noun, verb, adv
  "m": "excessively eager to please or obey",          // precise definition, <= 14 words, must not contain the word
  "s": "...",                   // ONE GRE-level sentence (15-32 words) whose context makes the meaning inferable; contains the
                                // exact plain word once, uninflected (case-insensitive whole-word match)
  "syn": ["servile", "fawning"],   // 2-4 synonyms (prefer other GRE words)
  "ant": ["domineering"],          // 1-3 antonyms ([] allowed only if none sensible)
  "root": "Latin obsequi, 'to comply'"  // short etymology or memory hook, <= 12 words
}
Word choice: 12 genuinely high-frequency GRE words per lesson (think Manhattan Prep 500 Essential + Advanced, Magoosh,
Barron's 333, ETS Official Guide). Mix of easier and harder. No word may appear in two lessons — stay inside your cluster.

### Text Completion (4 per lesson: 2 single-blank, 2 double-blank)
single: { "q": "Sentence(s) with exactly one _____ blank.", "blanks": [["a","b","c","d","e"]], "answer": [2], "why": "..." }
double: { "q": "Text with (i) _____ and (ii) _____ blanks.", "blanks": [["a","b","c"],["d","e","f"]], "answer": [0,2], "why": "..." }
- Real ETS style: 1-3 sentences, academic/literary/scientific register, logic driven by signal words (although, yet,
  far from, hardly, belies, not so much X as Y...). At least one of the lesson's words must be the correct answer
  in each question; distractors are plausible GRE words (they may come from other clusters).
- Exactly one defensible answer per blank. "why" (1-2 sentences) explains the clue and why the trap is wrong.
- Vary the position of correct answers.

### Sentence Equivalence (4 per lesson)
{ "q": "One sentence with one _____ blank.", "choices": ["a","b","c","d","e","f"], "answer": [1,4], "why": "..." }
- Exactly TWO choices complete the sentence AND produce sentences alike in meaning. Include at least one trap: a pair of
  synonyms that do NOT fit the context, or a word that fits but has no partner. At least one correct choice is a lesson word.
- "why" explains the clue and the trap. Vary answer positions.

Self-check every question like an ETS item reviewer: one (TC) / exactly two (SE) correct, no ambiguity, grammatical fit
of every choice, no answer revealed by grammar alone.

## Validate before finishing
Run: OPENSSL_CONF=/dev/null node /Users/SC/.openclaw/workspace/spelling-land/tools/gre/validate.js <your-file.json>
Fix everything it reports until it prints OK.
