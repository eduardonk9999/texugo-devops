(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem storage, segue o jogo */ } },
  };

  const pad = (n) => String(n).padStart(6, "0");

  // ---------- toast ----------
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  // ---------- céu estrelado ----------
  const stars = document.querySelector(".stars");
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const s = document.createElement("i");
    s.className = "star" + (rnd() > 0.88 ? " big" : "");
    s.style.left = (rnd() * 100).toFixed(2) + "%";
    s.style.top = (rnd() * 62).toFixed(2) + "%";
    s.style.animationDelay = (rnd() * 2.4).toFixed(2) + "s";
    stars.appendChild(s);
  }

  // ---------- montanhas em escadinha ----------
  function stepped(el, step, start, swing) {
    const pts = ["0% 100%"];
    let h = start;
    for (let x = 0; x < 100; x += step) {
      h = Math.max(15, Math.min(95, h + (rnd() - 0.5) * swing));
      pts.push(`${x}% ${100 - h}%`, `${Math.min(x + step, 100)}% ${100 - h}%`);
    }
    pts.push("100% 100%");
    el.style.clipPath = `polygon(${pts.join(",")})`;
  }
  stepped(document.querySelector(".mountains.far"), 2.5, 55, 26);
  stepped(document.querySelector(".mountains.near"), 2, 45, 22);

  // ---------- placar / clicker ----------
  const scoreEl = document.getElementById("score");
  const hiEl = document.getElementById("hiscore");
  const youEl = document.getElementById("rank-you");
  const badger = document.getElementById("badger");
  let score = 0;
  let hi = parseInt(store.get("texugo-hi") || "0", 10) || 0;
  hiEl.textContent = pad(hi);

  function addScore(n) {
    score += n;
    scoreEl.textContent = pad(score);
    youEl.textContent = pad(score);
    if (score > hi) {
      hi = score;
      hiEl.textContent = pad(hi);
      store.set("texugo-hi", String(hi));
    }
    if (score % 1000 === 0) toast(`LEVEL UP! ${score / 1000 + 1} favos de mel`);
  }

  badger.addEventListener("click", (e) => {
    addScore(100);
    const pop = document.createElement("span");
    pop.className = "pop";
    pop.textContent = "+100";
    const r = badger.getBoundingClientRect();
    const x = e.clientX ? e.clientX - r.left : r.width / 2;
    const y = e.clientY ? e.clientY - r.top : r.height / 3;
    pop.style.left = x - 20 + "px";
    pop.style.top = y - 20 + "px";
    badger.appendChild(pop);
    setTimeout(() => pop.remove(), 820);
  });

  // ---------- barras de status ----------
  const statsBox = document.querySelector(".stats");
  const fillBars = () => document.querySelectorAll(".stat").forEach((s) => {
    s.querySelector(".bar i").style.width = s.dataset.value + "%";
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver((entries, obs) => {
      if (entries.some((en) => en.isIntersecting)) { fillBars(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(statsBox);
  } else {
    fillBars();
  }

  // ---------- diálogo estilo RPG ----------
  const lines = [
    "Oi! Eu sou o texugo-do-mel, também chamado de ratel. Meu nome científico é Mellivora capensis: 'comedor de mel do Cabo'.",
    "Apesar do nome, não sou texugo de verdade. Sou da família das doninhas e lontras, mas numa subfamília só minha: Mellivorinae.",
    "Tenho fama de ser o bicho mais destemido do mundo. Leão, hiena, leopardo... se vier, eu encaro.",
    "Minha pele é grossa e frouxa. Se alguém me agarra pelo cangote, eu me viro aqui dentro e mordo de volta.",
    "Como até cobra venenosa. Se uma me pica, às vezes eu apago um tempinho... depois acordo e termino o lanche.",
    "Agora você já sabe tudo. Aperta START e vem comigo. Só não mexe no meu mel.",
  ];
  const textEl = document.getElementById("dialog-text");
  const idxEl = document.getElementById("dialog-idx");
  document.getElementById("dialog-total").textContent = lines.length;
  let idx = 0;
  let typing = null;

  function typeLine(i) {
    clearInterval(typing);
    idxEl.textContent = i + 1;
    const full = lines[i];
    if (reduceMotion) { textEl.textContent = full; typing = null; return; }
    let n = 0;
    textEl.textContent = "";
    typing = setInterval(() => {
      n++;
      textEl.textContent = full.slice(0, n);
      if (n >= full.length) { clearInterval(typing); typing = null; }
    }, 24);
  }

  function nextLine() {
    if (typing) { // termina a fala atual de uma vez
      clearInterval(typing);
      typing = null;
      textEl.textContent = lines[idx];
      return;
    }
    idx = (idx + 1) % lines.length;
    typeLine(idx);
  }

  document.getElementById("dialog-next").addEventListener("click", nextLine);
  document.querySelector(".dialog").addEventListener("click", (e) => {
    if (!e.target.closest(".dialog-next")) nextLine();
  });

  const dialogSection = document.getElementById("dialogo");
  let dialogStarted = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting) && !dialogStarted) { dialogStarted = true; typeLine(0); }
    }, { threshold: 0.4 }).observe(dialogSection);
  } else {
    typeLine(0);
  }

  function dialogInView() {
    const r = dialogSection.getBoundingClientRect();
    return r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.3;
  }

  // ---------- ícones pixel art das conquistas ----------
  const PAL = {
    K: "#0c0816", Y: "#f6b72f", O: "#c47a12", W: "#fff3c4", H: "#8a5a2b",
    G: "#63e2a8", D: "#2f9d6c", R: "#ff6f91", C: "#fbf8ef", S: "#a99fc4", B: "#6cc6ff",
  };
  const ICONS = {
    skin: [
      ".KKKKKKKKKK.", ".KCCCCSSSSK.", ".KCCCCSSSSK.", ".KCCCCSSSSK.",
      ".KCCCCSSSSK.", ".KSSSSCCCCK.", ".KSSSSCCCCK.", "..KSSSCCCK..",
      "..KSSSCCCK..", "...KSSCCK...", "....KSCK....", ".....KK.....",
    ],
    honey: [
      "....KKKK....", "...KHHHHK...", "....KKKK....", "...KYYYYK...",
      "..KYWYYYYK..", "..KYWYYYYK..", "..KYYYYYYK..", "..KYYYYYOK..",
      "..KYYYYOOK..", "...KOOOOK...", "....KKKK....", "............",
    ],
    snake: [
      "............", "..KKKK......", ".KGGGGK.....", ".KGKGGGK....",
      ".KGGGGGK....", "..KRKKGK....", "...R..KGK...", ".......KGK..",
      "...KKKKGGK..", "..KGGGGGK...", ".KGGKKKK....", "..KK........",
    ],
    shovel: [
      "............", ".C...C...C..", ".CK..CK..CK.", ".CCK.CCK.CCK",
      "..CK..CK..CK", "..SK..SK..SK", "...K...K...K", ".KKKKKKKKKK.",
      ".KOOOOOOOOK.", ".KHOHOOHOOK.", "..KKKKKKKK..", "............",
    ],
    key: [
      "............", "............", "..KKKK......", ".KYYYYK.....",
      "KYYKKYYK....", "KYK..KYK....", "KYYKKYYKKKKK", ".KYYYYKYYYYK",
      "..KKKKKKYKYK", "........K.K.", "............", "............",
    ],
    lock: [
      "....KKKK....", "...KSSSSK...", "..KSK..KSK..", "..KSK..KSK..",
      ".KKKKKKKKKK.", ".KCCCCCCCCK.", ".KCCCKKCCCK.", ".KCCCKKCCCK.",
      ".KCCCCKCCCK.", ".KCCCCCCCCK.", ".KKKKKKKKKK.", "............",
    ],
    crown: [
      "............", ".Y...Y...Y..", ".YY..YY..YY.", ".YYYYYYYYYY.",
      ".YRYYBYYRYY.", ".YYYYYYYYYY.", ".OOOOOOOOOO.", "............",
      "..YY.YY.YY..", ".YWYYWYYWYY.", "..YY.YY.YY..", "............",
    ],
  };
  function iconURL(grid) {
    const c = document.createElement("canvas");
    c.width = c.height = 12;
    const ctx = c.getContext("2d");
    grid.forEach((row, y) => [...row].forEach((ch, x) => {
      if (PAL[ch]) { ctx.fillStyle = PAL[ch]; ctx.fillRect(x, y, 1, 1); }
    }));
    return c.toDataURL();
  }
  function setIcon(el, name) { el.style.backgroundImage = `url(${iconURL(ICONS[name])})`; }
  document.querySelectorAll(".ach-icon").forEach((el) => {
    const name = [...el.classList].find((c) => c.startsWith("icon-")).slice(5);
    setIcon(el, name);
  });

  // ---------- código Konami ----------
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kpos = 0;
  let unlocked = false;

  function honeyRain() {
    if (reduceMotion) return;
    const rain = document.getElementById("honey-rain");
    for (let i = 0; i < 40; i++) {
      const d = document.createElement("i");
      d.className = "drop";
      d.style.left = Math.random() * 100 + "vw";
      d.style.animationDuration = 1.6 + Math.random() * 1.8 + "s";
      d.style.animationDelay = Math.random() * 1.2 + "s";
      rain.appendChild(d);
      setTimeout(() => d.remove(), 5000);
    }
  }

  function unlockSecret() {
    honeyRain();
    addScore(9900);
    if (unlocked) return;
    unlocked = true;
    const card = document.querySelector(".ach.locked");
    card.classList.remove("locked");
    card.classList.add("unlocked-now");
    setIcon(card.querySelector(".ach-icon"), "crown");
    card.querySelector("h3").textContent = "Modo Mel";
    card.querySelector("p").textContent = "Você achou o código secreto. O texugo aprova (e quer seu mel).";
    toast("CONQUISTA DESBLOQUEADA: MODO MEL");
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kpos = key === KONAMI[kpos] ? kpos + 1 : (key === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; unlockSecret(); }

    if (e.key === "Enter" && dialogInView() && !e.target.closest("a, button")) {
      e.preventDefault();
      nextLine();
    }
  });
})();
