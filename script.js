(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var queryText = "SELECT review_score, COUNT(*) FROM orders GROUP BY 1;";

  function initYear() {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    var skills = document.getElementById("skills");

    if (reducedMotion) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      if (skills) skills.classList.add("is-inview");
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      if (skills) skills.classList.add("is-inview");
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { revealObserver.observe(el); });

    if (!skills) return;

    var skillsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        skills.classList.add("is-inview");
        skillsObserver.disconnect();
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });

    skillsObserver.observe(skills);
  }

  function formatValue(el, value) {
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var shown = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    return shown + suffix;
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var duration = 700;
    var start = performance.now();

    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatValue(el, target * eased);
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function initCounters() {
    var block = document.querySelector("[data-stats]");
    if (!block) return;
    var nums = block.querySelectorAll("[data-count]");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      block.classList.add("is-counted");
      return;
    }

    nums.forEach(function (el) {
      el.textContent = formatValue(el, 0);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        block.classList.add("is-counted");
        nums.forEach(animateCount);
        observer.disconnect();
      });
    }, { threshold: 0.25 });

    observer.observe(block);
  }

  function initTerminal() {
    var root = document.querySelector("[data-terminal]");
    if (!root) return;
    var queryEl = root.querySelector("[data-query]");
    var lines = Array.prototype.slice.call(root.querySelectorAll(".term-line"));
    if (!queryEl || reducedMotion || !("IntersectionObserver" in window)) return;

    var generation = 0;
    var timers = [];

    queryEl.textContent = "";
    root.classList.add("is-live");

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function wait(ms, fn, gen) {
      var id = setTimeout(function () {
        if (gen !== generation) return;
        fn();
      }, ms);
      timers.push(id);
    }

    function play(gen) {
      var index = 0;
      queryEl.textContent = "";
      lines.forEach(function (line) { line.classList.remove("is-on"); });

      function typeChar() {
        if (gen !== generation) return;
        if (index < queryText.length) {
          queryEl.textContent += queryText.charAt(index);
          index += 1;
          wait(26, typeChar, gen);
          return;
        }
        showLine(0);
      }

      function showLine(n) {
        if (gen !== generation) return;
        if (n < lines.length) {
          lines[n].classList.add("is-on");
          wait(420, function () { showLine(n + 1); }, gen);
          return;
        }
        wait(3000, function () { play(gen); }, gen);
      }

      typeChar();
    }

    function start() {
      clearTimers();
      generation += 1;
      play(generation);
    }

    function stop() {
      clearTimers();
      generation += 1;
    }

    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) start();
      else stop();
    }, { threshold: 0.2 });

    observer.observe(root);
  }

  function initProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar || reducedMotion) return;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var value = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      bar.style.transform = "scaleX(" + value + ")";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    var links = Array.prototype.slice.call(menu.querySelectorAll("a"));
    var pairs = links.map(function (link) {
      var id = (link.getAttribute("href") || "").slice(1);
      return { link: link, section: document.getElementById(id) };
    }).filter(function (pair) { return pair.section; });

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.classList.remove("is-open");
    }

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      menu.classList.add("is-open");
    }

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") closeMenu();
      else openMenu();
    });

    links.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!menu.classList.contains("is-open")) return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });

    if (!("IntersectionObserver" in window)) return;

    var visible = new Set();

    function mark() {
      var bestId = null;
      var bestTop = Infinity;
      pairs.forEach(function (pair) {
        if (!visible.has(pair.section.id)) return;
        var distance = Math.abs(pair.section.getBoundingClientRect().top);
        if (distance < bestTop) {
          bestTop = distance;
          bestId = pair.section.id;
        }
      });
      pairs.forEach(function (pair) {
        var on = pair.section.id === bestId;
        pair.link.classList.toggle("is-active", on);
        if (on) pair.link.setAttribute("aria-current", "true");
        else pair.link.removeAttribute("aria-current");
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      mark();
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });

    pairs.forEach(function (pair) { observer.observe(pair.section); });
  }

  initYear();
  initNav();
  initProgress();
  initReveal();
  initCounters();
  initTerminal();
})();
