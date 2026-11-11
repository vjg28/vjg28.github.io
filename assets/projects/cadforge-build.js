/* CADForge build animation: caption chips (and optional code line and history bar)
   laid over the looping video and timed from video.currentTime, so the text stays crisp and editable.
   Markup: <div class="cfb" data-style="chip|code"><video>…</video></div> */
(function () {
  var CAPS = [
    { t: 0.15, e: 2.15, text: "The agent writes a sketch.", code: [[0, 'cq.Workplane("XY").circle(50)']] },
    { t: 2.15, e: 4.35, text: "Code becomes a solid.", code: [[0, ".extrude(12)"], [0.8, '.faces(">Z").circle(28).extrude(28)'], [1.55, ".cboreHole(38, 47, 14)"]] },
    { t: 4.35, e: 6.1, text: "Six M8 holes on a 75 mm bolt circle.", code: [[0, ".polarArray(37.5, 90, 360, 6).hole(9)"], [1.0, ".cboreHole(9, 15, 5)"]] },
    { t: 6.1, e: 8.0, text: "Then ribs, fillets and chamfers.", code: [[0, ".union(ribs)"], [1.35, ".edges(rim).fillet(2).chamfer(1)"]] },
    { t: 8.0, e: 9.55, text: "Checked against the target: reward 0.97.", code: [[0, "submit()  →  reward 0.97"]] },
    { t: 9.55, e: 11.9, text: "The code is the history, so it replays exactly.", code: [[0, "# rewind 7 steps, run again"]] },
    { t: 11.9, e: 14.9, text: "It bolts down and takes a bearing and a shaft,", code: [[0, "cq.Assembly().add(plate).add(bearing).add(shaft)"]] },
    { t: 14.9, e: 17.95, text: "and it turns.", code: [[0, "# spin the shaft"]] }
  ];
  var HIST = { rw0: 9.6, rw1: 10.45, rp0: 10.75, rp1: 11.65 };
  var BUILD = [2.75, 3.4, 4.1, 5.15, 5.95, 6.85, 7.45]; // swap times of the 7 stages

  function el(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }

  function setup(box) {
    var v = box.querySelector("video");
    if (!v) return;
    var style = box.getAttribute("data-style") || "chip";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var cap = el("div", "cfb-cap", box);
    cap.setAttribute("aria-hidden", "true");
    var txt = el("div", "cfb-txt", cap);
    var code = style === "code" ? el("div", "cfb-code", cap) : null;
    var hist = null, ticks = [], thumb = null;
    if (style === "code") {
      hist = el("div", "cfb-hist", box);
      hist.setAttribute("aria-hidden", "true");
      var rail = el("div", "cfb-rail", hist);
      for (var i = 0; i < 7; i++) {
        var tk = el("span", "cfb-tick", rail);
        tk.style.left = (i / 6) * 100 + "%";
        ticks.push(tk);
      }
      thumb = el("span", "cfb-thumb", rail);
      el("span", "cfb-hlabel", hist).textContent = "history";
    }

    var cur = -1, curCode = "";
    function show(i) {
      cur = i;
      if (i < 0) { cap.classList.remove("on"); return; }
      var c = CAPS[i];
      txt.innerHTML = "";
      c.text.split(" ").forEach(function (w, k) {
        var s = el("span", "w", txt);
        s.textContent = w + " ";
        s.style.transitionDelay = (k * 45) + "ms";
      });
      cap.classList.remove("on");
      void cap.offsetWidth;
      cap.classList.add("on");
    }
    function stageAt(t) {
      if (t >= HIST.rw0 && t < HIST.rw1) return 6 - Math.min(6, Math.floor((t - HIST.rw0) / (HIST.rw1 - HIST.rw0) * 7));
      if (t >= HIST.rw1 && t < HIST.rp0) return 0;
      if (t >= HIST.rp0 && t < HIST.rp1) return Math.min(6, Math.floor((t - HIST.rp0) / (HIST.rp1 - HIST.rp0) * 7));
      var s = -1;
      for (var i = 0; i < BUILD.length; i++) if (t >= BUILD[i] - 0.5) s = i;
      return s;
    }
    function tick() {
      var t = v.currentTime;
      var i = -1;
      for (var k = 0; k < CAPS.length; k++) if (t >= CAPS[k].t && t < CAPS[k].e) i = k;
      if (i !== cur) show(i);
      if (code && i >= 0) {
        var lines = CAPS[i].code, line = lines[0][1];
        for (var j = 0; j < lines.length; j++) if (t - CAPS[i].t >= lines[j][0]) line = lines[j][1];
        if (line !== curCode) {
          curCode = line;
          code.textContent = line;
          code.classList.remove("type"); void code.offsetWidth; code.classList.add("type");
        }
      }
      if (hist) {
        var s = stageAt(t);
        var on = t > 2.3 && t < 12.1;
        hist.classList.toggle("on", on);
        if (s >= 0) thumb.style.left = (s / 6) * 100 + "%";
        for (var m = 0; m < 7; m++) ticks[m].classList.toggle("done", m <= s);
      }
    }
    var raf = 0;
    function loop() { tick(); raf = requestAnimationFrame(loop); }
    v.addEventListener("play", function () { cancelAnimationFrame(raf); loop(); });
    v.addEventListener("pause", function () { cancelAnimationFrame(raf); tick(); });
    v.addEventListener("seeked", tick);

    var held = false; // paused by the reader (or by reduced motion) rather than by scrolling away
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    if (reduce) {
      // no autoplay: drop back to the poster (the finished part)
      held = true;
      v.removeAttribute("autoplay");
      v.pause();
      v.load();
      box.classList.add("still");
    } else if ("IntersectionObserver" in window) {
      // play only while on screen
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { if (!held) play(); }
          else v.pause();
        });
      }, { threshold: 0.2 }).observe(box);
    }
    // click toggles play / pause (also the way in when reduced motion is on)
    box.addEventListener("click", function () {
      if (v.paused) { held = false; box.classList.remove("still"); play(); }
      else { held = true; v.pause(); }
    });
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll(".cfb"), setup); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
