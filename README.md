# Spelling Land

A Typing-Land-style spelling game, live at **https://spelling-land.pages.dev/** (public, no login).
Levels: TK, Kindergarten, Grades 2–5 (spelling), and **GRE Verbal** (vocabulary + real GRE question types).

- Kid levels: 64 lessons, ~600 words, 5 games (Look & Learn, Fill the Gap, Word Scramble, Balloon Pop, Spelling Bee).
- GRE Verbal: 30 meaning-cluster lessons, 360 high-frequency GRE words (definition, synonyms, antonyms, root, sentence),
  120 Text Completion + 120 Sentence Equivalence questions with explanations. Games: Study Cards, Meaning Match,
  Text Completion, Sentence Equivalence, Word Recall.

## Layout

- `public/` — the whole static site (no build step). This folder is what gets deployed.
  - `words/g*.js` — one file per level (`gtk`, `gk`, `g2`…`g5`, `ggre`). Word format: `"r[ai]n"`, where the
    brackets mark the spelling-pattern letters (highlighted pink, blanked in Fill the Gap). Each word has a sentence
    `s` (must contain the word), a meaning `m`, and optionally `e` (emoji picture), `d` (display text, e.g. "Aa"),
    and `say` (what the voice says, e.g. "A" for a letter). A lesson can limit its games with
    `games: ["learn","balloon","test"]`.
  - `app.js` — screens, players, progress (localStorage `spellingland.v1`), the 5 games, stars, badges.
  - `audio.js` — Web Audio sound effects + music, and `Voice`, which plays the pre-recorded clips (falls back to
    browser speech for anything without a clip).
  - `phrases.js` — fixed spoken lines (praise, "Almost! It's spelled…"). Add new spoken lines here.
  - `audio/af_heart/*.mp3` + `audio/manifest.js` — the recorded voice (generated, see below).
  - `keyboard.js` — on-screen keyboard with finger guide (tap-able on tablets).
- `tools/` — voice recording pipeline and GRE content sources (not deployed).
  - `tools/gre/part1..5.json` — the GRE lessons (source of truth). `tools/gre/SPEC.md` describes the format;
    `node tools/gre/validate.js tools/gre/part*.json` checks it; `node tools/gre/build_gre.js` regenerates
    `public/words/ggre.js`.

## Recording the voice

Voice: **Kokoro** (open-source neural TTS, Apache-2.0), run locally. Games use `af_heart`; "Read it to me"
(lesson title, rule, tip, examples) uses `af_sky` (`--read-aloud`). Every word (normal + slow),
sentence, lesson rule/tip, phrase and letter name gets its own mp3, named by a hash of its text.

```bash
# one-time setup (≈350 MB model, kept in tools/models, never deployed)
cd tools && uv venv -p 3.12 .venv && uv pip install -p .venv/bin/python kokoro-onnx soundfile
curl -LO --output-dir models https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO --output-dir models https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# record whatever is missing (re-run after adding/changing words; only new lines are recorded)
tools/.venv/bin/python tools/build_audio.py --shard 0/2 &   # two workers ≈ 25 clips/min on this Mac
tools/.venv/bin/python tools/build_audio.py --shard 1/2
tools/.venv/bin/python tools/build_audio.py --read-aloud    # the "Read it to me" voice
tools/.venv/bin/python tools/build_audio.py --manifest-only
tools/.venv/bin/python tools/build_audio.py --prune          # delete clips for lines that no longer exist
```

`--only-levels gre` / `--skip-levels gre` limit a run to (or away from) one level.

Mispronounced words: add a phoneme override to `PRON` in `tools/build_audio.py`, delete that word's clips, and
re-run. Phonics notation like `/b/` in rule text is spoken as the sound ("buh"), via `SOUNDS`.

## Deploy

After editing, bump `?v=N` in `public/index.html`, then:

```bash
./deploy.sh preview   # https://preview.spelling-land.pages.dev
./deploy.sh           # production
```

## License

Code and word lists: MIT (see `LICENSE`). The voice is generated with
[Kokoro](https://github.com/hexgrad/kokoro) (Apache-2.0).
