// ============================================================
//  UX Case Studies — animated deck controller
//  Keyboard + click navigation, progress, theme, fullscreen.
// ============================================================

(function () {
  "use strict";

  const root = document.documentElement;
  const THEME_KEY = "bdn-theme";

  /* ---- Theme (shared with the portfolio) ---- */
  const themeToggle = document.getElementById("theme-toggle");
  function applyTheme(theme) {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ---- Slides ---- */
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const counter = document.getElementById("counter");
  const progress = document.getElementById("progress");
  const dotsWrap = document.getElementById("dots");
  const hint = document.getElementById("hint");

  let current = 0;

  const pad = (n) => String(n).padStart(2, "0");

  /* ---- Build dots ---- */
  slides.forEach((s, i) => {
    const dot = document.createElement("button");
    dot.className = "dot" + (s.hasAttribute("data-section") ? " dot--sec" : "");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function render() {
    slides.forEach((s, i) => {
      s.classList.toggle("is-active", i === current);
      s.classList.toggle("is-prev", i < current);
    });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
    counter.textContent = pad(current + 1) + " / " + pad(total);
    progress.style.width = ((current) / (total - 1) * 100) + "%";
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  function goTo(i) {
    const next = Math.max(0, Math.min(total - 1, i));
    if (next === current) return;
    current = next;
    render();
  }
  const nextSlide = () => goTo(current + 1);
  const prevSlide = () => goTo(current - 1);

  prevBtn.addEventListener("click", prevSlide);
  nextBtn.addEventListener("click", nextSlide);

  /* ---- Keyboard ---- */
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        e.preventDefault(); nextSlide(); break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault(); prevSlide(); break;
      case "Home":
        e.preventDefault(); goTo(0); break;
      case "End":
        e.preventDefault(); goTo(total - 1); break;
      case "f":
      case "F":
        toggleFullscreen(); break;
    }
  });

  /* ---- Touch / swipe ---- */
  let touchX = null;
  const deck = document.getElementById("deck");
  deck.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  deck.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) (dx < 0 ? nextSlide : prevSlide)();
    touchX = null;
  }, { passive: true });

  /* ---- Wheel (debounced, horizontal-ish) ---- */
  let wheelLock = false;
  deck.addEventListener("wheel", (e) => {
    const active = slides[current];
    // let the slide scroll internally if it overflows
    if (active.scrollHeight > active.clientHeight + 4) return;
    if (wheelLock) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 18) return;
    wheelLock = true;
    (d > 0 ? nextSlide : prevSlide)();
    setTimeout(() => { wheelLock = false; }, 650);
  }, { passive: true });

  /* ---- Fullscreen ---- */
  const fsBtn = document.getElementById("fs-btn");
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  if (fsBtn) fsBtn.addEventListener("click", toggleFullscreen);

  /* ---- Deep link via #hash (e.g. #7) ---- */
  function fromHash() {
    const n = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(n) && n >= 1 && n <= total) current = n - 1;
  }
  fromHash();
  window.addEventListener("hashchange", () => { fromHash(); render(); });

  /* ---- Hide hint after first interaction / timeout ---- */
  let hintHidden = false;
  function hideHint() {
    if (hintHidden || !hint) return;
    hintHidden = true;
    hint.classList.add("is-hidden");
  }
  ["keydown", "click", "touchstart", "wheel"].forEach((ev) =>
    document.addEventListener(ev, hideHint, { once: true, passive: true })
  );
  setTimeout(hideHint, 6000);

  render();
})();
