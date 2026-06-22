(function () {
  var EMAIL = "info@atomicmedia.in";
  var INSTAGRAM = "https://www.instagram.com/atomic.media.in?igsh=MWFrbGh3a3ppbnMwaQ==";
  var LINKEDIN = "https://www.linkedin.com/company/atomic-mediaa/";

  function savedTheme() {
    try {
      localStorage.removeItem("atomic-media-theme");
      localStorage.removeItem("atomic-media-theme-v2");
      localStorage.removeItem("atomic-media-theme-v3");
      localStorage.removeItem("atomic-media-theme-v4");
    } catch (error) {
    }
    return "dark";
  }

  function applyTheme(theme) {
    var isDark = theme === "dark";
    var root = document.documentElement;
    root.classList.remove("is-white-bg", "is-black-bg", "is-blue-bg");
    root.classList.toggle("atomic-theme-dark", isDark);
    root.classList.toggle("atomic-theme-white", !isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
    var toggle = document.querySelector("[data-atomic-theme-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute("aria-label", isDark ? "Switch to white theme" : "Switch to dark theme");
      toggle.querySelector("[data-theme-dark]").setAttribute("aria-current", isDark ? "true" : "false");
      toggle.querySelector("[data-theme-white]").setAttribute("aria-current", isDark ? "false" : "true");
    }
  }

  function lockThemeClasses() {
    var root = document.documentElement;
    if (lockThemeClasses.observer || !window.MutationObserver) return;
    lockThemeClasses.observer = new MutationObserver(function () {
      if (root.classList.contains("is-white-bg") || root.classList.contains("is-black-bg") || root.classList.contains("is-blue-bg")) {
        root.classList.remove("is-white-bg", "is-black-bg", "is-blue-bg");
      }
    });
    lockThemeClasses.observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  function persistTheme(theme) {
    try {
      localStorage.removeItem("atomic-media-theme");
      localStorage.removeItem("atomic-media-theme-v2");
      localStorage.removeItem("atomic-media-theme-v3");
      localStorage.removeItem("atomic-media-theme-v4");
    } catch (error) {}
    applyTheme(theme);
  }

  function mountThemeToggle() {
    if (document.querySelector("[data-atomic-theme-toggle]")) return;
    var headerRight = document.querySelector("#header-right");
    var menuButton = document.querySelector("#header-right-menu-btn");
    var aboutSlot = document.querySelector("[data-atomic-about-theme-slot]");
    if ((!headerRight || !menuButton) && !aboutSlot) return;

    var button = document.createElement("button");
    button.id = "atomic-theme-toggle";
    button.type = "button";
    button.setAttribute("data-atomic-theme-toggle", "true");
    button.innerHTML = '<span data-theme-dark>Dark</span><span data-theme-white>White</span>';
    button.addEventListener("click", function () {
      persistTheme(document.documentElement.classList.contains("atomic-theme-dark") ? "white" : "dark");
    });
    if (aboutSlot) {
      button.classList.add("atomic-about-theme-toggle");
      aboutSlot.appendChild(button);
    } else {
      headerRight.insertBefore(button, menuButton);
    }
    applyTheme(savedTheme());
  }

  function updateLinks() {
    Array.from(document.querySelectorAll("a[href^='mailto:']")).forEach(function (link) {
      link.href = "mailto:" + EMAIL;
      if (/@/.test(link.textContent || "")) link.textContent = EMAIL;
    });

    Array.from(document.querySelectorAll("a[href*='instagram.com']")).forEach(function (link) {
      link.href = INSTAGRAM;
    });

    Array.from(document.querySelectorAll("a[href*='linkedin.com']")).forEach(function (link) {
      link.href = LINKEDIN;
    });
  }

  function mountFooterEffect() {
    var footer = document.querySelector("#footer-section");
    if (!footer || footer.querySelector(".atomic-footer-hover-word")) return;

    var background = document.createElement("div");
    background.className = "atomic-footer-background-gradient";
    background.setAttribute("aria-hidden", "true");

    var word = document.createElement("div");
    word.className = "atomic-footer-hover-word";
    word.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 420 100" xmlns="http://www.w3.org/2000/svg" aria-label="ATOMIC MEDIA">' +
      '<defs>' +
      '<linearGradient id="atomicFooterGradient" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffffff"/><stop offset="25%" stop-color="#ff7a18"/><stop offset="50%" stop-color="#ff3d00"/><stop offset="75%" stop-color="#facc15"/><stop offset="100%" stop-color="#ffffff"/></linearGradient>' +
      '<radialGradient id="atomicFooterRevealMask" gradientUnits="userSpaceOnUse" r="22%" cx="50%" cy="50%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient>' +
      '<mask id="atomicFooterTextMask"><rect x="0" y="0" width="100%" height="100%" fill="url(#atomicFooterRevealMask)"/></mask>' +
      '</defs>' +
      '<text class="atomic-footer-text atomic-footer-text-shadow" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" stroke-width="0.35">ATOMIC MEDIA<tspan class="atomic-footer-dot">.</tspan></text>' +
      '<text class="atomic-footer-text atomic-footer-text-draw" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" stroke-width="0.35">ATOMIC MEDIA<tspan class="atomic-footer-dot">.</tspan></text>' +
      '<text class="atomic-footer-text atomic-footer-text-reveal" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" stroke="url(#atomicFooterGradient)" stroke-width="0.35" mask="url(#atomicFooterTextMask)">ATOMIC MEDIA<tspan class="atomic-footer-dot">.</tspan></text>' +
      '</svg>';

    footer.insertBefore(background, footer.firstChild);
    footer.insertBefore(word, background.nextSibling);

    var svg = word.querySelector("svg");
    var mask = word.querySelector("#atomicFooterRevealMask");
    if (!svg || !mask) return;

    svg.addEventListener("mousemove", function (event) {
      var rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mask.setAttribute("cx", (((event.clientX - rect.left) / rect.width) * 100) + "%");
      mask.setAttribute("cy", (((event.clientY - rect.top) / rect.height) * 100) + "%");
    });
  }

  function mountMenuFallback() {
    var header = document.querySelector("#header");
    var menuButton = document.querySelector("#header-right-menu-btn");
    var menu = document.querySelector("#header-menu");
    if (!header || !menuButton || !menu || menuButton.getAttribute("data-atomic-menu-ready") === "true") return;

    menuButton.setAttribute("data-atomic-menu-ready", "true");
    menuButton.addEventListener("click", function () {
      var isOpen = header.classList.toggle("--menu-opened");
      menu.classList.toggle("--opened", isOpen);
      menuButton.setAttribute("aria-expanded", String(isOpen));
      document.documentElement.classList.toggle("atomic-menu-open", isOpen);
    });

    Array.from(menu.querySelectorAll("a")).forEach(function (link) {
      link.addEventListener("click", function () {
      header.classList.remove("--menu-opened");
      menu.classList.remove("--opened");
      menuButton.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("atomic-menu-open");
    });
    });
  }

  applyTheme(savedTheme());
  lockThemeClasses();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      mountThemeToggle();
      mountFooterEffect();
      mountMenuFallback();
      updateLinks();
    });
  } else {
    mountThemeToggle();
    mountFooterEffect();
    mountMenuFallback();
    updateLinks();
  }
})();
