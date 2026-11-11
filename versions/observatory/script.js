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
  document.querySelectorAll('.mini-sky').forEach(c => starField(c, { count: 200, pole: [0.5, 0.45], trail: 0.08, speed: 0.0012, fadeWithDawn: false }));

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
  function sunBox(c, iw, ih) {
    const W = c.width, H = c.height;
    if (narrow()) { const h = H * 0.4, w = h * iw / ih; return { x: (W - w) / 2, y: H - h, w, h }; }
    const h = H * 0.72, w = h * iw / ih;
    return { x: Math.max(W * 0.52, W - w - W * 0.07), y: H - h, w, h };
  }

  if (window.loadPortrait) {
    window.loadPortrait('../../assets/photos/portrait.jpg').then(P => {
      madeOfStars(P);
      sunriseLit(P);
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
      const step = Math.max(2, Math.round(3 * d * Math.max(1, B.w / 620)));
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
            b: 0.2 + L * 0.85, s: (0.35 + L * 1.1) * d, warm: Math.random() < 0.12, ph: Math.random() * 6.28
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

  // ---------- footer: portrait lit by the sunrise ----------
  function sunriseLit({ iw, ih, cut }) {
    const c = document.getElementById('sunrise');
    if (!c) return;
    const ctx = c.getContext('2d');
    const lit = document.createElement('canvas'); lit.width = iw; lit.height = ih;
    const lctx = lit.getContext('2d');
    const paintLit = k => {
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, iw, ih); lctx.drawImage(cut, 0, 0);
      lctx.globalCompositeOperation = 'source-atop';
      const g = lctx.createLinearGradient(0, ih, 0, 0);
      g.addColorStop(0, `rgba(255,140,60,${0.15 + k * 0.25})`); g.addColorStop(0.6, 'rgba(255,170,90,0)');
      lctx.fillStyle = g; lctx.fillRect(0, 0, iw, ih);
      lctx.fillStyle = `rgba(10,12,30,${0.5 - k * 0.42})`; lctx.fillRect(0, 0, iw, ih);
      lctx.globalCompositeOperation = 'source-over';
    };
    let rise = 0;
    const ridge = [[0, .9], [.1, .84], [.2, .88], [.32, .8], [.44, .87], [.56, .82], [.68, .89], [.8, .83], [.9, .87], [1, .85]];
    const draw = () => {
      const W = c.width, H = c.height, d = DPR();
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(4,6,13,0)');
      g.addColorStop(0.5, `rgba(${30 + rise * 30 | 0},${20 + rise * 10 | 0},34,${0.35 + rise * 0.3})`);
      g.addColorStop(1, `rgba(${70 + rise * 90 | 0},${34 + rise * 30 | 0},26,${0.6 + rise * 0.4})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const B = sunBox(c, iw, ih);
      const sx = B.x + B.w / 2, sy = H + B.w * 0.35 - rise * B.h * 0.6, sr = Math.max(B.w * 1.05, W * 0.28);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(255,225,180,1)'); sg.addColorStop(0.25, 'rgba(255,178,96,.95)');
      sg.addColorStop(0.55, 'rgba(227,118,46,.42)'); sg.addColorStop(1, 'rgba(227,118,46,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
      paintLit(rise);
      ctx.save();
      ctx.shadowColor = `rgba(255,170,90,${0.35 + rise * 0.6})`; ctx.shadowBlur = (10 + rise * 30) * d;
      ctx.drawImage(lit, B.x, B.y, B.w, B.h);
      ctx.restore();
      ctx.fillStyle = '#05040a';
      ctx.beginPath(); ctx.moveTo(0, H);
      ridge.forEach(([x, y]) => ctx.lineTo(x * W, Math.max(y * H, H - 220 * d + (y - 0.8) * 400 * d)));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    };
    const frame = () => {
      if (visible(c)) {
        const r = contact.getBoundingClientRect();
        const target = clamp(1 - r.top / innerHeight);
        rise += reduce ? (target - rise) : (target - rise) * 0.06;
        draw();
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    const resize = () => { fit(c); draw(); };
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

  // ---------- nav highlight ----------
  const links = [...document.querySelectorAll('.nav .links a')];
  const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIo = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => navIo.observe(t));
  }

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
