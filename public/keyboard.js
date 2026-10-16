/* On-screen keyboard with finger guide (tap-able on tablets). */

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
  LABEL: { Backspace: "⌫", Enter: "⏎", " ": "space · hear again" },
  el: null,
  onKey: null,

  html() {
    const rows = this.ROWS.map((row, r) => {
      const off = this.OFFSETS[r] ? `<span class="key spacer" style="width:calc(var(--k) * ${this.OFFSETS[r]})"></span>` : "";
      const keys = row.map(k => {
        const cls = ["key"];
        if (k.length === 1 && k !== " ") cls.push("letter");
        if (k === "Backspace" || k === "Enter") cls.push("wide");
        if (k === " ") cls.push("space");
        if (k === "f" || k === "j") cls.push("home");
        return `<button class="${cls.join(" ")}" data-key="${k === "'" ? "&#39;" : k}">${this.LABEL[k] || k}</button>`;
      }).join("");
      return `<div class="krow">${off}${keys}</div>`;
    }).join("");
    const finger = (id, h) => `<div class="finger" data-f="${id}" style="height:calc(var(--k) * ${h})"><span class="dot"></span></div>`;
    const hands = `
      <div class="hands">
        <div class="hand left">${finger("L5", 1.2)}${finger("L4", 1.55)}${finger("L3", 1.7)}${finger("L2", 1.55)}<div class="finger thumb" data-f="T" style="height:calc(var(--k) * .85)"><span class="dot"></span></div></div>
        <div class="hand right"><div class="finger thumb" data-f="T" style="height:calc(var(--k) * .85)"><span class="dot"></span></div>${finger("R2", 1.55)}${finger("R3", 1.7)}${finger("R4", 1.55)}${finger("R5", 1.2)}</div>
      </div>`;
    return `<div class="keyboard">${rows}</div>${hands}`;
  },

  mount(container, onKey) {
    container.innerHTML = this.html();
    this.el = container;
    this.onKey = onKey;
    // the hands use the keyboard's --k size
    const k = getComputedStyle(container.querySelector(".keyboard")).getPropertyValue("--k");
    container.querySelector(".hands").style.setProperty("--k", k);
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
    this.el.querySelectorAll(".finger.on").forEach(f => f.classList.remove("on"));
    if (!k) return;
    const b = this.keyEl(k);
    if (b) b.classList.add("next");
    const f = this.FINGER[k];
    if (f) this.el.querySelectorAll(`.finger[data-f="${f}"]`).forEach(x => x.classList.add("on"));
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
