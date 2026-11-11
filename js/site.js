(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = () => Math.min(devicePixelRatio || 1, 2);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const fit = c => {
    const d = DPR(), r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d));
    return d;
  };
  const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

  // ---------- dawn: 0 at top, 1 at the bottom ----------
  let dawn = 0;
  const setDawn = () => {
    const max = root.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max) : 0;
    dawn = Math.pow(p, 3);
    root.style.setProperty('--dawn', dawn.toFixed(3));
  };
  addEventListener('scroll', setDawn, { passive: true });
  addEventListener('resize', setDawn);
  setDawn();

  // ---------- rotating star field ----------
  function starField(canvas, { count, pole, trail, speed, fadeWithDawn }) {
    const ctx = canvas.getContext('2d');
    let stars = [], t = 0;
    const resize = () => {
      const d = fit(canvas), reach = Math.hypot(canvas.width, canvas.height);
      stars = Array.from({ length: count }, () => ({
        a: Math.random() * Math.PI * 2, r: Math.pow(Math.random(), 0.7) * reach,
        s: (Math.random() * 1.1 + 0.25) * d, b: Math.random() * 0.75 + 0.25,
        tw: Math.random() * Math.PI * 2, warm: Math.random() < 0.18
      }));
      ctx.fillStyle = '#04060d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    const frame = () => {
      ctx.fillStyle = `rgba(4, 6, 13, ${reduce ? 1 : trail})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width * pole[0], cy = canvas.height * pole[1];
      const fade = fadeWithDawn ? 1 - dawn * 0.75 : 1;
      for (const s of stars) {
        const a = s.a + t, tw = 0.75 + 0.25 * Math.sin(t * 40 + s.tw);
        ctx.fillStyle = s.warm ? `rgba(255,214,170,${s.b * tw * fade})` : `rgba(214,224,255,${s.b * tw * fade})`;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s.r, cy + Math.sin(a) * s.r, s.s, 0, 6.283); ctx.fill();
      }
      t += speed;
      if (!reduce) requestAnimationFrame(frame);
    };
    resize(); addEventListener('resize', resize); frame();
  }
  const sky = document.getElementById('sky');
  if (sky) starField(sky, { count: innerWidth < 640 ? 240 : 480, pole: [0.82, 0.08], trail: 0.22, speed: 0.00045, fadeWithDawn: true });

  // ---------- portrait helpers ----------
  const hero = document.querySelector('.hero');
  const contact = document.getElementById('contact');
  const narrow = () => innerWidth < 640;

  function heroBox(c, iw, ih) {
    const W = c.width, H = c.height;
    if (narrow()) { const h = H * 0.42, w = h * iw / ih; return { x: (W - w) / 2, y: H * 0.07, w, h }; }
    const h = H * 0.84, w = h * iw / ih;
    return { x: Math.max(W * 0.5, W - w - W * 0.05), y: H - h, w, h };
  }
  if (window.loadPortrait) {
    window.loadPortrait('assets/photos/portrait.jpg').then(P => {
      madeOfStars(P);
    }).catch(() => { /* portrait missing: hero and footer still read fine without it */ });
  }

  // ---------- hero: portrait made of stars, released on scroll ----------
  function madeOfStars({ iw, ih, lum, mask }) {
    const c = document.getElementById('portrait');
    if (!c) return;
    const ctx = c.getContext('2d');
    let pts = [], mx = -1e9, my = -1e9;
    const init = () => {
      const d = fit(c), B = heroBox(c, iw, ih);
      pts = [];
      // ?dots=N multiplies the dot density (used by versions/portrait-dots to compare); smaller dots as it rises
      const k = clamp(parseFloat(new URLSearchParams(location.search).get('dots')) || 3, 0.5, 6);
      const step = Math.max(1.2, 3 * d * Math.max(1, B.w / 620) / Math.sqrt(k)), shrink = Math.pow(k, -0.3);
      for (let y = B.y; y < B.y + B.h; y += step) {
        for (let x = B.x; x < B.x + B.w; x += step) {
          const ix = Math.min(iw - 1, Math.floor((x - B.x) / B.w * iw));
          const iy = Math.min(ih - 1, Math.floor((y - B.y) / B.h * ih));
          const i = iy * iw + ix;
          if (mask[i] < 0.5) continue;
          const L = Math.pow(lum[i], 0.8);
          if (Math.random() > 0.16 + L * 0.9) continue;
          const tx = x + (Math.random() - 0.5) * step, ty = y + (Math.random() - 0.5) * step;
          // scatter destination: drift up and outward into the sky
          const ang = Math.random() * Math.PI * 2, dist = (0.3 + Math.random() * 0.9) * c.height;
          pts.push({
            tx, ty, x: tx, y: ty, vx: 0, vy: 0,
            rx: tx + Math.cos(ang) * dist, ry: ty + Math.sin(ang) * dist * 0.6 - c.height * 0.35,
            b: 0.2 + L * 0.85, s: (0.35 + L * 1.1) * d * shrink, warm: Math.random() < 0.12, ph: Math.random() * 6.28
          });
        }
      }
    };
    let t = 0;
    const frame = () => {
      if (visible(c) || reduce) {
        ctx.clearRect(0, 0, c.width, c.height);
        const sc = reduce ? 0 : clamp(scrollY / (hero.offsetHeight * 0.75));
        const ease = sc * sc * (3 - 2 * sc);
        const R = 70 * DPR();
        for (const p of pts) {
          const gx = p.tx + (p.rx - p.tx) * ease, gy = p.ty + (p.ry - p.ty) * ease;
          if (reduce) { p.x = gx; p.y = gy; }
          else {
            p.vx += (gx - p.x) * 0.02; p.vy += (gy - p.y) * 0.02;
            const dx = p.x - mx, dy = p.y - my, dd = dx * dx + dy * dy;
            if (dd < R * R) { const dist = Math.sqrt(dd) + 1, f = (1 - dist / R) * 2.2; p.vx += dx / dist * f; p.vy += dy / dist * f; }
            p.vx *= 0.86; p.vy *= 0.86; p.x += p.vx; p.y += p.vy;
          }
          const tw = 0.8 + 0.2 * Math.sin(t * 60 + p.ph), a = p.b * tw * (1 - ease * 0.55);
          ctx.fillStyle = p.warm ? `rgba(255,214,170,${a})` : `rgba(220,228,255,${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 - ease * 0.3), 0, 6.283); ctx.fill();
        }
      }
      t += 0.0004;
      if (!reduce) requestAnimationFrame(frame);
    };
    hero.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), d = DPR();
      mx = (e.clientX - r.left) * d; my = (e.clientY - r.top) * d;
    });
    hero.addEventListener('pointerleave', () => { mx = my = -1e9; });
    init();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { init(); if (reduce) frame(); }, 150); });
    frame();
  }

  sunrise();

  // ---------- footer: the sun rises behind the ridge ----------
  function sunrise() {
    const c = document.getElementById('sunrise');
    if (!c) return;
    const ctx = c.getContext('2d');
    let rise = 0;
    // three ridges, far to near: smooth noise profiles, hazier and lighter the farther they are
    const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
    const profile = (n, rough) => { const p = []; let v = 0.5; for (let i = 0; i <= n; i++) { v += (rnd() - 0.5) * rough; v = Math.min(0.95, Math.max(0.05, v)); p.push(v); } return p; };
    const layers = [
      { base: 0.72, amp: 0.20, pts: profile(14, 0.9), col: [62, 38, 52], haze: 0.75, drift: 0.02, rim: 1 },
      { base: 0.82, amp: 0.13, pts: profile(11, 0.9),  col: [28, 18, 30], haze: 0.45, drift: 0.05, rim: 0.4 },
      { base: 0.92, amp: 0.08, pts: profile(9, 0.8),  col: [6, 5, 11],   haze: 0.0,  drift: 0.09 },
    ];
    const ridgeY = (L, x, H) => {                     // smooth (cosine) interpolation between points
      const f = clamp(x) * (L.pts.length - 1), i = Math.floor(f), t = f - i;
      const a = L.pts[i], b = L.pts[Math.min(i + 1, L.pts.length - 1)];
      const k = (1 - Math.cos(t * Math.PI)) / 2;
      let v = a + (b - a) * k;
      if (L.seat) { const q = (x - L.seat.x) / L.seat.w; v += (L.seat.v - v) * Math.exp(-q * q) * 0.85; }
      return H * (L.base - v * L.amp);
    };
    // glow falloff with zero slope at its edge, so stacked radial gradients never show a ring
    const fall = (t, k) => Math.exp(-k * t) * (1 - t * t) ** 2;
    const softStops = (g, rgb, a, k) => { for (let i = 0; i <= 20; i++) g.addColorStop(i / 20, `rgba(${rgb},${(a * fall(i / 20, k)).toFixed(4)})`); };
    const soft = (x, y, R, ex, rgb, a, k) => {
      if (a < 0.003 || R < 1) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(ex, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); softStops(g, rgb, a, k);
      ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
    };
    // a faint grain on top breaks up 8-bit banding in the dark gradients
    const grain = document.createElement('canvas'); grain.width = grain.height = 128;
    { const gx = grain.getContext('2d'), id = gx.createImageData(128, 128);
      for (let i = 0; i < id.data.length; i += 4) { id.data[i] = id.data[i + 1] = id.data[i + 2] = Math.random() * 4 | 0; id.data[i + 3] = 255; }
      gx.putImageData(id, 0, 0); }
    const grainPat = ctx.createPattern(grain, 'repeat');
    const sunCan = document.createElement('canvas'), sctx = sunCan.getContext('2d');
    const rayCan = document.createElement('canvas'), rctx = rayCan.getContext('2d');
    const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
    const sunR = (W, H) => Math.min(W, H) * (narrow() ? 0.11 : 0.09);
    let seatFor = '';
    const draw = (now = performance.now()) => {
      const W = c.width, H = c.height, d = W / Math.max(1, c.clientWidth), time = now / 1000;
      ctx.clearRect(0, 0, W, H);
      // sky warming towards the horizon
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(4,6,13,0)');
      g.addColorStop(0.45, `rgba(${120 + rise * 70 | 0},${56 + rise * 34 | 0},${44},${0.1 + rise * 0.22})`); // warm and thin, so the page glow keeps building instead of dipping
      g.addColorStop(0.72, `rgba(${80 + rise * 110 | 0},${40 + rise * 46 | 0},${40 + rise * 4 | 0},${0.5 + rise * 0.4})`);
      g.addColorStop(1, `rgba(${130 + rise * 110 | 0},${62 + rise * 50 | 0},${36},1)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // the sun crests a gentle saddle in the far ridge, so it comes up evenly instead of sliding down a slope
      const sx = W * (narrow() ? 0.5 : 0.62), sr = sunR(W, H);
      if (seatFor !== W + 'x' + H) {
        seatFor = W + 'x' + H; layers[0].seat = null;
        const raw = ridgeY(layers[0], sx / W, H);
        layers[0].seat = { x: sx / W, w: sr * 3.4 / W, v: (layers[0].base - raw / H) / layers[0].amp - 0.04 };
      }
      let horizon = 0; for (let k = -2; k <= 2; k++) horizon += ridgeY(layers[0], (sx + k * sr * 0.4) / W, H) / 5;
      const sy = horizon + sr * (1.15 - rise * 0.95);             // fully hidden at rise 0, ~40% above the ridge at 1
      const lit = clamp(1 - (sy - horizon) / sr, 0, 2) / 2;
      const glowA = Math.min(1, 0.25 + lit * 1.4) * (0.5 + rise * 0.5);
      // a wide warm wash along the horizon
      soft(sx, horizon, Math.max(W, H) * 0.6, 2.0, '255,150,80', 0.32 * glowA, 1.6);
      // an even crown of rays from the whole visible arc, drawn at quarter size and scaled up so the edges stay soft
      if (lit > 0) {
        const RS = 4, N = narrow() ? 25 : 36, Rm = Math.hypot(W, H) * 0.65, over = 0.12, step = (Math.PI + 2 * over) / N;
        rayCan.width = Math.ceil(W / RS); rayCan.height = Math.ceil(H / RS);
        rctx.setTransform(1 / RS, 0, 0, 1 / RS, 0, 0); rctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < N; i++) {
          const ang = -Math.PI - over + (i + 0.5) * step + (hash(i) - 0.5) * step * 0.5;
          const len = Rm * (0.7 + 0.3 * hash(i + 40)), w = step * 0.42 * (0.7 + 0.6 * hash(i + 90));
          const a = 0.13 * lit * (0.8 + 0.2 * Math.sin(time * 0.35 + i * 1.9)) * (0.55 + 0.45 * Math.max(0, Math.sin(-ang)));
          const rg = rctx.createRadialGradient(sx, sy, sr * 0.9, sx, sy, len); softStops(rg, '255,200,140', 1, 2.2);
          rctx.fillStyle = rg;
          for (const k of [1, 0.55, 0.25]) {
            rctx.globalAlpha = a * 0.4; rctx.beginPath(); rctx.moveTo(sx, sy);
            rctx.lineTo(sx + Math.cos(ang - w * k) * len, sy + Math.sin(ang - w * k) * len);
            rctx.lineTo(sx + Math.cos(ang + w * k) * len, sy + Math.sin(ang + w * k) * len);
            rctx.closePath(); rctx.fill();
          }
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(rayCan, 0, 0, rayCan.width * RS, rayCan.height * RS); ctx.restore();
      }
      // stacked soft glows: a broad corona, then a tight bloom
      soft(sx, sy, sr * 8, 1.3, '255,176,96', 0.45 * glowA, 2.4);
      soft(sx, sy, sr * 2.6, 1, '255,226,180', 0.55 * glowA, 3.2);
      // the disc: limb-darkened, feathered edge, warmer and redder towards the ridge
      {
        const f = 1.1 * d, S = Math.ceil((sr + f) * 2 + 2), cx = S / 2, e = (sr - f) / (sr + f);
        sunCan.width = sunCan.height = S;
        const dg = sctx.createRadialGradient(cx, cx, 0, cx, cx, sr + f);
        dg.addColorStop(0, '#fff8ea'); dg.addColorStop(0.6 * e, '#ffefcf'); dg.addColorStop(0.92 * e, '#ffd9a0');
        dg.addColorStop(e, 'rgba(255,196,128,1)'); dg.addColorStop(1, 'rgba(255,196,128,0)');
        sctx.fillStyle = dg; sctx.fillRect(0, 0, S, S);
        sctx.globalCompositeOperation = 'source-atop';
        const top = cx - sr, warm = 0.95 * (1 - rise * 0.3);
        const vg = sctx.createLinearGradient(0, top, 0, Math.max(top + 1, cx + horizon - sy));
        vg.addColorStop(0, 'rgba(255,140,60,0)'); vg.addColorStop(0.55, `rgba(255,128,56,${warm * 0.45})`); vg.addColorStop(1, `rgba(240,86,40,${warm})`);
        sctx.fillStyle = vg; sctx.fillRect(0, 0, S, S);
        ctx.drawImage(sunCan, sx - cx, sy - cx);
      }
      // ridges, far to near; the two farther ones catch a lit rim near the sun
      layers.forEach((L, li) => {
        const shift = (1 - rise) * L.drift * H, stepX = Math.max(3, W / 300), pts = [];
        for (let x = 0; x <= W + stepX; x += stepX) pts.push([x, ridgeY(L, x / W, H) + shift]);
        ctx.beginPath(); ctx.moveTo(0, H); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(W, H); ctx.closePath();
        const top = H * (L.base - L.amp) + shift;
        const lg = ctx.createLinearGradient(0, top, 0, H);
        const [r, gg, b] = L.col, wm = L.haze * (0.4 + rise * 0.6);
        lg.addColorStop(0, `rgb(${r + 62 * wm | 0},${gg + 34 * wm | 0},${b + 14 * wm | 0})`);
        lg.addColorStop(0.35, `rgb(${r},${gg},${b})`);
        lg.addColorStop(1, `rgb(${Math.max(0, r - 10)},${Math.max(0, gg - 6)},${Math.max(4, b - 6)})`);
        ctx.fillStyle = lg; ctx.fill();
        if (L.rim) {
          ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
          const ra = L.rim * glowA, R = Math.max(W, H) * 0.3;
          soft(sx, horizon + shift, R * 0.6, 1.6, '255,150,90', ra * 0.22, 2.2);
          ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R); softStops(sg, '255,196,130', ra, 2.0);
          ctx.strokeStyle = sg; ctx.lineWidth = 3 * d; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.restore();
        }
        if (li === 2) return;
        // mist band in front of the farther ridges
        const mist = ctx.createLinearGradient(0, ridgeY(L, 0.5, H) + shift, 0, H);
        mist.addColorStop(0, 'rgba(255,170,120,0)'); mist.addColorStop(0.5, `rgba(180,110,110,${0.10 + rise * 0.08})`); mist.addColorStop(1, 'rgba(180,110,110,0)');
        ctx.fillStyle = mist; ctx.fillRect(0, top, W, H - top);
      });
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    };
    const frame = now => {
      if (visible(c)) {
        const r = contact.getBoundingClientRect();
        // reaches 1 once the whole footer is on screen (or it fills the viewport)
        const target = clamp((innerHeight - r.top) / Math.min(innerHeight, r.height));
        rise += reduce ? (target - rise) : (target - rise) * 0.06;
        draw(typeof now === 'number' ? now : performance.now());
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    const resize = () => { seatFor = ''; fit(c); draw(); };
    resize(); addEventListener('resize', resize);
    if (reduce) addEventListener('scroll', frame, { passive: true });
    frame();
  }

  // ---------- headline reveals ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  // ---------- write-up images: scale up as they scroll into view ----------
  const pops = [...document.querySelectorAll('.vp .article figure img, .vp .shot-hero img')];
  if (pops.length && !reduce) {
    let ticking = false;
    const pop = () => {
      ticking = false;
      const vh = innerHeight;
      pops.forEach(img => {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55)));
        const e = 1 - Math.pow(1 - p, 3);
        img.style.setProperty('--pop', (0.9 + 0.1 * e).toFixed(4));
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pop); } }, { passive: true });
    addEventListener('resize', pop);
    pop();
  }

  // ---------- nav highlight ----------
  const links = [...document.querySelectorAll('.nav .links a[href^="#"]')];
  const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => navIo.observe(t));
  }

  // ---------- blueprints and project tabs ----------
  if (window.Blueprints) window.Blueprints.init();
  const tabs = [...document.querySelectorAll('.tabs button')];
  tabs.forEach(b => b.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.id !== b.getAttribute('aria-controls'); });
    if (window.Blueprints) window.dispatchEvent(new Event('resize'));
  }));

  // ---------- earlier work toggle ----------
  document.querySelectorAll('.show-more').forEach(b => b.addEventListener('click', () => {
    const t = document.getElementById(b.getAttribute('aria-controls'));
    const open = t.hidden; t.hidden = !open;
    b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? 'Show less' : `Show ${t.children.length} more`;
  }));

  // ---------- header gets a backdrop once you scroll past the top ----------
  const navEl = document.querySelector('.nav');
  const onNav = () => navEl && document.querySelector('.hero') && navEl.classList.toggle('scrolled', scrollY > innerHeight * 0.6);
  addEventListener('scroll', onNav, { passive: true }); onNav();

  // ---------- email: assembled only when asked for ----------
  document.querySelectorAll('.email-btn').forEach(btn => btn.addEventListener('click', async () => {
    const addr = `${btn.dataset.u}@${btn.dataset.d}`;
    const label = btn.querySelector('span');
    if (!btn.classList.contains('shown')) {
      btn.classList.add('shown'); label.textContent = addr;
      btn.setAttribute('aria-label', `Copy ${addr}`);
      return;
    }
    try { await navigator.clipboard.writeText(addr); label.textContent = 'Copied'; setTimeout(() => (label.textContent = addr), 1600); }
    catch { location.href = 'mailto:' + addr; }
  }));

  // ---------- copy email ----------
  const copy = document.getElementById('copy'), email = document.getElementById('email');
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(email.textContent.trim()); copy.textContent = 'Copied'; }
    catch {
      const range = document.createRange(); range.selectNodeContents(email);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      copy.textContent = 'Selected';
    }
    setTimeout(() => (copy.textContent = 'Copy'), 1800);
  });
})();
