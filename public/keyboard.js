/* On-screen keyboard (tap-able on tablets). Keys are tinted by finger zone; a finger guide
   under the keyboard says which finger presses the next key. */

const KB = {
  ROWS: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "Backspace"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "'", "Enter"],
    ["z", "x", "c", "v", "b", "n", "m"],
    [" "],
  ],
  OFFSETS: [0, 0.3, 0.85, 0],
  FINGER: {
    q: "L5", a: "L5", z: "L5",
    w: "L4", s: "L4", x: "L4",
    e: "L3", d: "L3", c: "L3",
    r: "L2", f: "L2", v: "L2", t: "L2", g: "L2", b: "L2",
    y: "R2", h: "R2", n: "R2", u: "R2", j: "R2", m: "R2",
    i: "R3", k: "R3",
    o: "R4", l: "R4",
    p: "R5", "'": "R5", Enter: "R5", Backspace: "R5",
    " ": "T",
  },
  FINGER_NAME: {
    L5: "left pinky", L4: "left ring finger", L3: "left middle finger", L2: "left pointer finger",
    T: "thumb", R2: "right pointer finger", R3: "right middle finger", R4: "right ring finger", R5: "right pinky",
  },
  LABEL: { Backspace: "⌫", Enter: "⏎", " ": "space · hear again" },
  el: null,
  onKey: null,

  html() {
    const rows = this.ROWS.map((row, r) => {
      const off = this.OFFSETS[r] ? `<span class="key spacer" style="width:calc(var(--k) * ${this.OFFSETS[r]})"></span>` : "";
      const keys = row.map(k => {
        const cls = ["key", "z-" + this.FINGER[k]];
        if (k.length === 1 && k !== " ") cls.push("letter");
        if (k === "Backspace" || k === "Enter") cls.push("wide");
        if (k === " ") cls.push("space");
        if (k === "f" || k === "j") cls.push("home");
        return `<button class="${cls.join(" ")}" data-key="${k === "'" ? "&#39;" : k}">${this.LABEL[k] || k}</button>`;
      }).join("");
      return `<div class="krow">${off}${keys}</div>`;
    }).join("");
    const dot = id => `<span class="fdot z-${id}" data-f="${id}"></span>`;
    const guide = `
      <div class="finger-guide">
        <span class="fgroup">${dot("L5")}${dot("L4")}${dot("L3")}${dot("L2")}</span>
        ${dot("T")}
        <span class="fgroup">${dot("R2")}${dot("R3")}${dot("R4")}${dot("R5")}</span>
        <span class="flabel" id="fingerLabel">Keys are colored by finger</span>
      </div>`;
    return `<div class="keyboard">${rows}</div>${guide}`;
  },

  mount(container, onKey) {
    container.innerHTML = this.html();
    this.el = container;
    this.onKey = onKey;
    container.querySelectorAll(".key:not(.spacer)").forEach(b => {
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        Sound.resume();
        if (this.onKey) this.onKey(b.dataset.key);
      });
    });
  },

  keyEl(k) {
    if (!this.el) return null;
    return [...this.el.querySelectorAll(".key")].find(b => b.dataset.key === k) || null;
  },

  setNext(k) {
    if (!this.el) return;
    this.el.querySelectorAll(".key.next").forEach(b => b.classList.remove("next"));
    this.el.querySelectorAll(".fdot.on").forEach(f => f.classList.remove("on"));
    const label = this.el.querySelector("#fingerLabel");
    if (!k) { if (label) label.textContent = "Keys are colored by finger"; return; }
    const b = this.keyEl(k);
    if (b) b.classList.add("next");
    const f = this.FINGER[k];
    if (f) this.el.querySelectorAll(`.fdot[data-f="${f}"]`).forEach(x => x.classList.add("on"));
    if (label && f) label.innerHTML = `Use your <b>${this.FINGER_NAME[f]}</b>`;
  },

  flash(k, ok) {
    const b = this.keyEl(k);
    if (!b) return;
    const cls = ok ? "press" : "bad";
    b.classList.remove("press", "bad");
    void b.offsetWidth;
    b.classList.add(cls);
    setTimeout(() => b.classList.remove(cls), ok ? 120 : 320);
  },
};
