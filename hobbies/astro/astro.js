// Astrophotography page: a real star chart of the winter sky with observed targets,
// links between chart, chips and log entries, a photo lightbox, and a Newtonian
// telescope drawing registered into the site's Blueprints engine.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

  // ---------- bright star catalogue (J2000; RA in hours, Dec in degrees, V magnitude) ----------
  const STARS = {
    // Orion
    Betelgeuse: [5.9195, 7.407, 0.5, '#ffb27a'], Rigel: [5.2423, -8.202, 0.13, '#cfe0ff'], Bellatrix: [5.4189, 6.350, 1.64],
    Mintaka: [5.5334, -0.299, 2.23], Alnilam: [5.6036, -1.202, 1.69], Alnitak: [5.6793, -1.943, 1.77], Saiph: [5.7959, -9.670, 2.06],
    Meissa: [5.5856, 9.934, 3.39],
    // Taurus
    Aldebaran: [4.5987, 16.509, 0.85, '#ffc88a'], Elnath: [5.4382, 28.608, 1.65], 'ζ Tau': [5.6274, 21.143, 3.0],
    'ε Tau': [4.4770, 19.180, 3.53], 'γ Tau': [4.3299, 15.628, 3.65], 'δ¹ Tau': [4.3823, 17.543, 3.76], 'λ Tau': [4.0110, 12.490, 3.4],
    Alcyone: [3.7914, 24.105, 2.87],
    // Canis Major / Minor
    Sirius: [6.7525, -16.716, -1.46, '#d6e4ff'], Mirzam: [6.3783, -17.956, 1.98], Adhara: [6.9771, -28.972, 1.5], Wezen: [7.1399, -26.393, 1.83],
    Aludra: [7.4016, -29.303, 2.45], Muliphein: [7.0627, -15.633, 4.1], Furud: [6.3384, -30.063, 3.0],
    Procyon: [7.6550, 5.225, 0.34], Gomeisa: [7.4525, 8.289, 2.9],
    // Gemini
    Castor: [7.5767, 31.888, 1.58], Pollux: [7.7553, 28.026, 1.14, '#ffd6a0'], Alhena: [6.6285, 16.399, 1.93], Mebsuta: [6.7322, 25.131, 3.0],
    Tejat: [6.3827, 22.514, 2.87], Propus: [6.2479, 22.507, 3.3], Wasat: [7.3354, 21.982, 3.5], Mekbuda: [7.0685, 20.570, 3.8],
    Alzirr: [6.7548, 12.896, 3.35],
    // Cancer, Leo, Hydra
    Acubens: [8.9748, 11.858, 4.25], 'Asellus Australis': [8.7448, 18.154, 3.94], 'Asellus Borealis': [8.7212, 21.469, 4.66],
    Tarf: [8.2753, 9.186, 3.5], 'ι Cnc': [8.7782, 28.760, 4.0], Regulus: [10.1395, 11.967, 1.35], Alphard: [9.4598, -8.659, 1.98, '#ffc88a'],
    // Auriga
    Capella: [5.2782, 45.998, 0.08, '#fff2c8'], Menkalinan: [5.9921, 44.948, 1.9], Mahasim: [5.9954, 37.213, 2.6], Hassaleh: [4.9499, 33.166, 2.7],
    Almaaz: [5.0328, 43.823, 3.0],
    // Perseus
    Mirfak: [3.4054, 49.861, 1.79], Algol: [3.1361, 40.956, 2.12], 'δ Per': [3.7154, 47.788, 3.0], 'ε Per': [3.9642, 40.010, 2.9],
    'ζ Per': [3.9022, 31.884, 2.85], 'γ Per': [3.0799, 53.506, 2.9], 'η Per': [2.8450, 55.896, 3.8], Atik: [3.7380, 32.288, 3.8],
    // Cassiopeia
    Schedar: [0.6751, 56.537, 2.24], Caph: [0.1530, 59.150, 2.28], 'γ Cas': [0.9451, 60.717, 2.15], Ruchbah: [1.4302, 60.235, 2.68],
    Segin: [1.9066, 63.670, 3.37],
    // Andromeda, Pegasus, Aries, Triangulum
    Alpheratz: [0.1398, 29.091, 2.06], Mirach: [1.1622, 35.621, 2.05], Almach: [2.0650, 42.330, 2.1], 'δ And': [0.6555, 30.861, 3.27],
    'μ And': [0.9458, 38.499, 3.87], 'ν And': [0.8302, 41.079, 4.5],
    Markab: [23.0794, 15.205, 2.48], Scheat: [23.0629, 28.083, 2.42], Algenib: [0.2206, 15.184, 2.83],
    Hamal: [2.1196, 23.463, 2.0], Sheratan: [1.9107, 20.808, 2.64], Mesarthim: [1.8920, 19.294, 3.9],
    'β Tri': [2.1590, 34.987, 3.0], 'α Tri': [1.8847, 29.579, 3.4],
    // Cetus, Eridanus, Lepus
    Diphda: [0.7265, -17.987, 2.04], Menkar: [3.0380, 4.090, 2.53], Mira: [2.3224, -2.978, 3.0],
    Zaurak: [3.9672, -13.509, 2.95], Cursa: [5.1308, -5.086, 2.79], Arneb: [5.5455, -17.822, 2.58], Nihal: [5.4708, -20.759, 2.84]
  };
  const LINES = [
    // Orion
    ['Meissa', 'Betelgeuse'], ['Meissa', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'],
    ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'], ['Saiph', 'Rigel'],
    // Taurus
    ['λ Tau', 'γ Tau'], ['γ Tau', 'δ¹ Tau'], ['δ¹ Tau', 'ε Tau'], ['ε Tau', 'Elnath'], ['γ Tau', 'Aldebaran'], ['Aldebaran', 'ζ Tau'],
    // Canis Major, Canis Minor, Lepus
    ['Mirzam', 'Sirius'], ['Sirius', 'Muliphein'], ['Sirius', 'Wezen'], ['Wezen', 'Adhara'], ['Wezen', 'Aludra'], ['Adhara', 'Furud'],
    ['Procyon', 'Gomeisa'], ['Arneb', 'Nihal'],
    // Gemini
    ['Castor', 'Pollux'], ['Castor', 'Mebsuta'], ['Mebsuta', 'Tejat'], ['Tejat', 'Propus'], ['Pollux', 'Wasat'], ['Wasat', 'Mekbuda'],
    ['Mekbuda', 'Alhena'], ['Wasat', 'Alzirr'],
    // Cancer
    ['Acubens', 'Asellus Australis'], ['Asellus Australis', 'Asellus Borealis'], ['Asellus Borealis', 'ι Cnc'], ['Asellus Australis', 'Tarf'],
    // Auriga
    ['Capella', 'Menkalinan'], ['Menkalinan', 'Mahasim'], ['Mahasim', 'Elnath'], ['Elnath', 'Hassaleh'], ['Hassaleh', 'Almaaz'], ['Almaaz', 'Capella'],
    // Perseus
    ['η Per', 'γ Per'], ['γ Per', 'Mirfak'], ['Mirfak', 'δ Per'], ['δ Per', 'ε Per'], ['ε Per', 'ζ Per'], ['ζ Per', 'Atik'], ['Mirfak', 'Algol'],
    // Cassiopeia
    ['Caph', 'Schedar'], ['Schedar', 'γ Cas'], ['γ Cas', 'Ruchbah'], ['Ruchbah', 'Segin'],
    // Andromeda + Pegasus square
    ['Alpheratz', 'δ And'], ['δ And', 'Mirach'], ['Mirach', 'Almach'], ['Mirach', 'μ And'], ['μ And', 'ν And'],
    ['Alpheratz', 'Scheat'], ['Scheat', 'Markab'], ['Markab', 'Algenib'], ['Algenib', 'Alpheratz'],
    // Aries, Triangulum
    ['Hamal', 'Sheratan'], ['Sheratan', 'Mesarthim'], ['α Tri', 'β Tri']
  ];
  const CONST_LABELS = [
    ['ORION', 5.55, 3.5], ['TAURUS', 4.3, 22.5], ['CANIS MAJOR', 6.95, -23], ['CANIS MINOR', 7.55, 1.5], ['GEMINI', 7.0, 30],
    ['CANCER', 8.6, 25], ['AURIGA', 5.5, 40], ['PERSEUS', 3.5, 45], ['CASSIOPEIA', 1.1, 64.5], ['ANDROMEDA', 1.3, 39],
    ['PEGASUS', 23.4, 22], ['ARIES', 2.3, 18.5], ['LEPUS', 5.6, -22.5], ['CETUS', 1.6, -10], ['HYDRA', 9.3, -4], ['LEO', 10.05, 17]
  ];
  // Observed targets with their true J2000 positions
  const TARGETS = [
    { id: 'm31', name: 'Andromeda', ra: 0 + 42 / 60 + 44 / 3600, dec: 41 + 16 / 60, kind: 'galaxy' },
    { id: 'm45', name: 'Pleiades', ra: 3 + 47 / 60, dec: 24 + 7 / 60, kind: 'cluster' },
    { id: 'm42', name: 'Orion Nebula', ra: 5 + 35 / 60 + 17 / 3600, dec: -(5 + 23 / 60), kind: 'nebula' },
    { id: 'betelgeuse', name: 'Betelgeuse', ra: 5 + 55 / 60 + 10 / 3600, dec: 7 + 24 / 60, kind: 'star' },
    { id: 'sirius', name: 'Sirius', ra: 6 + 45 / 60 + 9 / 3600, dec: -(16 + 43 / 60), kind: 'star' },
    { id: 'm44', name: 'Beehive', ra: 8 + 40 / 60, dec: 19 + 59 / 60, kind: 'cluster' }
  ];

  // Chart window: RA 22.5h → 10.5h (east on the left), Dec −32° → +66°
  const RA_LEFT = 10.5, RA_SPAN = 12, DEC_TOP = 66, DEC_SPAN = 98;
  const normRA = ra => (ra > 12 ? ra - 24 : ra);

  // ---------- chart ----------
  const chart = document.getElementById('chart');
  let active = null;
  const chips = [...document.querySelectorAll('.targets button')];
  const entries = id => document.getElementById('t-' + id);

  function setActive(id, from) {
    active = id;
    chips.forEach(b => b.classList.toggle('on', b.dataset.id === id));
    document.querySelectorAll('.entry').forEach(e => e.classList.toggle('on', id && e.id === 't-' + id));
    if (reduce || !running) drawChart(0);
  }
  function goTo(id) {
    const e = entries(id);
    if (!e) return;
    setActive(id);
    e.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  let W = 0, H = 0, dpr = 1, running = false, visible = true;
  const ctx = chart && chart.getContext('2d');
  const pad = () => ({ l: 44 * dpr, r: 18 * dpr, t: 18 * dpr, b: 30 * dpr });
  function proj(ra, dec) {
    const p = pad();
    const x = p.l + (RA_LEFT - normRA(ra)) / RA_SPAN * (W - p.l - p.r);
    const y = p.t + (DEC_TOP - dec) / DEC_SPAN * (H - p.t - p.b);
    return [x, y];
  }
  function sizeChart() {
    if (!chart) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = chart.getBoundingClientRect();
    W = chart.width = Math.max(1, Math.round(r.width * dpr));
    H = chart.height = Math.max(1, Math.round(r.height * dpr));
    drawChart(0);
  }
  function text(s, x, y, size, color, align = 'left', base = 'middle') {
    ctx.fillStyle = color; ctx.font = `${size * dpr}px ${MONO}`; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y);
  }
  function drawChart(t) {
    if (!ctx || W < 50) return;
    const p = pad(), narrow = W / dpr < 560;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#060a18'); g.addColorStop(1, '#03050c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.lineWidth = dpr; ctx.strokeStyle = 'rgba(160,175,220,0.08)';
    ctx.beginPath();
    for (let h = -1; h <= 10; h++) { const [x] = proj(h, 0); ctx.moveTo(x, p.t); ctx.lineTo(x, H - p.b); }
    for (let d = -30; d <= 60; d += 10) { const [, y] = proj(0, d); ctx.moveTo(p.l, y); ctx.lineTo(W - p.r, y); }
    ctx.stroke();
    for (let h = -1; h <= 10; h += narrow ? 2 : 1) { const [x] = proj(h, 0); text(`${(h + 24) % 24}h`, x, H - p.b + 14 * dpr, 9, 'rgba(160,175,220,0.5)', 'center'); }
    for (let d = -30; d <= 60; d += narrow ? 20 : 10) { const [, y] = proj(0, d); text(`${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)}°`, p.l - 8 * dpr, y, 9, 'rgba(160,175,220,0.5)', 'right'); }
    // celestial equator
    ctx.strokeStyle = 'rgba(160,175,220,0.18)'; ctx.setLineDash([2 * dpr, 4 * dpr]);
    ctx.beginPath(); { const [x0, y0] = proj(10.5, 0), [x1] = proj(-1.5, 0); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); } ctx.stroke();
    // ecliptic (obliquity 23.44°)
    const eps = 23.439 * Math.PI / 180;
    ctx.strokeStyle = 'rgba(255,178,96,0.28)'; ctx.setLineDash([6 * dpr, 5 * dpr]);
    ctx.beginPath();
    let first = true;
    for (let lam = -40; lam <= 170; lam += 1) {
      const l = lam * Math.PI / 180;
      let ra = Math.atan2(Math.cos(eps) * Math.sin(l), Math.cos(l)) * 12 / Math.PI;
      if (ra < 0) ra += 24;
      const dec = Math.asin(Math.sin(eps) * Math.sin(l)) * 180 / Math.PI;
      const nra = normRA(ra);
      if (nra < -1.5 || nra > 10.5) { first = true; continue; }
      const [x, y] = proj(ra, dec);
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    { const [x, y] = proj(9.8, 14.5); text('ECLIPTIC', x, y, 8, 'rgba(255,178,96,0.5)', 'left'); }
    { const [x, y] = proj(10.4, -2.4); text('EQUATOR', x, y, 8, 'rgba(160,175,220,0.4)', 'left'); }

    // constellation lines
    ctx.strokeStyle = 'rgba(169,188,255,0.22)'; ctx.lineWidth = dpr;
    ctx.beginPath();
    for (const [a, b] of LINES) {
      const sa = STARS[a], sb = STARS[b]; if (!sa || !sb) continue;
      const [x0, y0] = proj(sa[0], sa[1]), [x1, y1] = proj(sb[0], sb[1]);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    }
    ctx.stroke();
    if (!narrow) for (const [n, ra, dec] of CONST_LABELS) { const [x, y] = proj(ra, dec); text(n, x, y, 8, 'rgba(160,175,220,0.35)', 'center'); }

    // stars
    for (const [name, s] of Object.entries(STARS)) {
      const [x, y] = proj(s[0], s[1]);
      const r = Math.max(0.7, Math.min(4.4, 3.4 - 0.62 * s[2])) * dpr;
      const tw = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 2 + x * 0.07);
      if (s[2] < 1.5) {
        const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        gl.addColorStop(0, 'rgba(220,230,255,0.28)'); gl.addColorStop(1, 'rgba(220,230,255,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = tw; ctx.fillStyle = s[3] || '#e6ecff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (!narrow && s[2] < 1.0 && name !== 'Betelgeuse' && name !== 'Sirius') text(name, x + r + 5 * dpr, y - 1, 8.5, 'rgba(200,210,240,0.55)');
    }

    // targets
    for (const tg of TARGETS) {
      const [x, y] = proj(tg.ra, tg.dec);
      const on = active === tg.id;
      const pulse = reduce ? 0 : (Math.sin(t * 2.2 + tg.ra) + 1) / 2;
      // deep-sky glyphs
      ctx.save();
      if (tg.kind === 'galaxy') { ctx.translate(x, y); ctx.rotate(-0.6); ctx.fillStyle = 'rgba(230,220,255,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0, 9 * dpr, 3 * dpr, 0, 0, TAU); ctx.fill(); }
      else if (tg.kind === 'nebula') { const gn = ctx.createRadialGradient(x, y, 0, x, y, 9 * dpr); gn.addColorStop(0, 'rgba(160,255,220,0.7)'); gn.addColorStop(1, 'rgba(160,255,220,0)'); ctx.fillStyle = gn; ctx.beginPath(); ctx.arc(x, y, 9 * dpr, 0, TAU); ctx.fill(); }
      else if (tg.kind === 'cluster') { ctx.fillStyle = 'rgba(210,225,255,0.9)'; for (let k = 0; k < 7; k++) { const a = k * 2.4, rr = (2 + (k % 3) * 2) * dpr; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 0.9 * dpr, 0, TAU); ctx.fill(); } }
      ctx.restore();
      const R = (on ? 16 : 12 + pulse * 3) * dpr;
      ctx.strokeStyle = on ? '#ffb260' : `rgba(255,178,96,${0.55 + pulse * 0.35})`;
      ctx.lineWidth = (on ? 1.6 : 1.1) * dpr;
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
      if (on) { ctx.strokeStyle = 'rgba(255,178,96,0.25)'; ctx.beginPath(); ctx.arc(x, y, R + 6 * dpr, 0, TAU); ctx.stroke(); }
      const left = x > W * 0.78;
      text(tg.name.toUpperCase(), x + (left ? -R - 6 * dpr : R + 6 * dpr), y, on ? 10 : 9, on ? '#ffb260' : 'rgba(255,214,170,0.85)', left ? 'right' : 'left');
    }
  }
  function hit(e) {
    const r = chart.getBoundingClientRect();
    const mx = (e.clientX - r.left) * dpr, my = (e.clientY - r.top) * dpr;
    let best = null, bd = (24 * dpr) ** 2;
    for (const tg of TARGETS) { const [x, y] = proj(tg.ra, tg.dec); const d = (x - mx) ** 2 + (y - my) ** 2; if (d < bd) { bd = d; best = tg.id; } }
    return best;
  }
  if (chart) {
    sizeChart();
    addEventListener('resize', sizeChart);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawChart(0));
    chart.addEventListener('pointermove', e => { const id = hit(e); chart.style.cursor = id ? 'pointer' : 'crosshair'; if (id !== active && (id || e.pointerType === 'mouse')) setActive(id); });
    chart.addEventListener('pointerleave', () => setActive(null));
    chart.addEventListener('click', e => { const id = hit(e); if (id) goTo(id); });
    if (!reduce) {
      let t0 = performance.now();
      const loop = now => { if (visible) drawChart((now - t0) / 1000); requestAnimationFrame(loop); };
      running = true; requestAnimationFrame(loop);
      if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(chart);
    }
  }
  chips.forEach(b => {
    b.addEventListener('pointerenter', () => setActive(b.dataset.id));
    b.addEventListener('focus', () => setActive(b.dataset.id));
    b.addEventListener('pointerleave', () => setActive(null));
    b.addEventListener('click', () => goTo(b.dataset.id));
  });

  // ---------- lightbox ----------
  const lb = document.getElementById('lightbox'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
  document.querySelectorAll('.shots button').forEach(b => b.addEventListener('click', () => {
    lbImg.src = b.dataset.full; lbImg.alt = b.querySelector('img').alt; lbCap.textContent = b.dataset.cap || '';
    if (lb.showModal) lb.showModal(); else window.open(b.dataset.full, '_blank');
  }));
  document.getElementById('lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  // ---------- Newtonian telescope drawing (registered into Blueprints) ----------
  if (!window.Blueprints) return;
  const C = {
    line: 'rgba(222, 230, 255, 0.88)', soft: 'rgba(190, 202, 240, 0.55)', faint: 'rgba(160, 175, 220, 0.22)',
    accent: '#ffb260', accentSoft: 'rgba(255, 178, 96, 0.55)', bg: '#060914', text: 'rgba(200, 210, 240, 0.8)'
  };
  const lbl = (c, s, x, y, px, align = 'left', color = C.text, size = 9) => { c.save(); c.fillStyle = color; c.font = `${size * px}px ${MONO}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore(); };
  const arrow = (c, x, y, a, px) => { const L = 6 * px, w = 2.2 * px; c.beginPath(); c.moveTo(x, y); c.lineTo(x - L * Math.cos(a) + w * Math.sin(a), y - L * Math.sin(a) - w * Math.cos(a)); c.lineTo(x - L * Math.cos(a) - w * Math.sin(a), y - L * Math.sin(a) + w * Math.cos(a)); c.closePath(); c.fill(); };
  const leader = (c, x0, y0, x1, y1, s, px, color = C.soft) => {
    c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = px; const dir = x1 >= x0 ? 1 : -1;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1 + dir * 22 * px, y1); c.stroke(); arrow(c, x0, y0, Math.atan2(y0 - y1, x0 - x1), px); c.restore();
    lbl(c, s, x1 + dir * 26 * px, y1, px, dir > 0 ? 'left' : 'right');
  };
  const dim = (c, x0, y0, x1, y1, off, s, px) => {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * off, ny = Math.cos(a) * off;
    c.save(); c.strokeStyle = C.soft; c.fillStyle = C.soft; c.lineWidth = px;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + nx * 1.15, y0 + ny * 1.15); c.moveTo(x1, y1); c.lineTo(x1 + nx * 1.15, y1 + ny * 1.15); c.stroke();
    const ax = x0 + nx, ay = y0 + ny, bx = x1 + nx, by = y1 + ny;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); arrow(c, ax, ay, a + Math.PI, px); arrow(c, bx, by, a, px);
    c.translate((ax + bx) / 2, (ay + by) / 2); let ta = a; if (ta > Math.PI / 2 || ta < -Math.PI / 2) ta += Math.PI; c.rotate(ta);
    c.font = `${9 * px}px ${MONO}`; const tw = c.measureText(s).width + 6 * px; c.fillStyle = C.bg; c.fillRect(-tw / 2, -6 * px, tw, 12 * px);
    c.fillStyle = C.text; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 0); c.restore();
  };
  const cline = (c, x0, y0, x1, y1, px) => { c.save(); c.strokeStyle = C.faint; c.lineWidth = px; c.setLineDash([14 * px, 4 * px, 2 * px, 4 * px]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); };

  window.Blueprints.drawings.newtonian = {
    meta: { title: 'AstroMaster 130EQ', no: '', scale: '1:10', matl: 'f/5 NEWTONIAN · EQ' },
    init() { return {}; },
    bounds: 42,
    draw(c, g, s, cx, cy, px, t, detail) {
      // model units: cm, y down; shifted so the whole instrument is centred
      const P = (x, y) => [cx + x * s, cy + (y - 6) * s];
      const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
      const phi = 21.7 * Math.PI / 180;                        // site latitude = polar axis elevation
      const elev = (38 + (reduce ? 0 : 2 * Math.sin(t * 0.25))) * Math.PI / 180;
      const u = [Math.cos(elev), -Math.sin(elev)];               // optical axis, towards the sky
      const n = [u[1], -u[0]];                                   // perpendicular, "up" side of the tube
      const pdir = [-Math.cos(phi), -Math.sin(phi)];             // polar axis, pointing north
      const ddir = [Math.sin(phi), -Math.cos(phi)];              // declination axis
      const head = [0, -4], apex = [0, 4];
      const saddle = add(head, ddir, 9);
      const Ctr = add(saddle, n, 8);
      const R = 7.5;                                             // tube radius (150 mm OD)
      const Q = add(Ctr, u, 23.5);                               // secondary mirror: 525 mm from primary, focus 125 mm out
      const F = add(Q, n, R + 5);
      const prim = add(Ctr, u, -29);
      const poly = pts => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = P(q[0], q[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
      const seg = (a, b) => { const [x0, y0] = P(a[0], a[1]), [x1, y1] = P(b[0], b[1]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
      const rect = (o, along, half, a0, a1) => poly([add(add(o, along, a0), [-along[1], along[0]], half), add(add(o, along, a1), [-along[1], along[0]], half), add(add(o, along, a1), [along[1], -along[0]], half), add(add(o, along, a0), [along[1], -along[0]], half)]);
      c.lineWidth = px;

      // ground + tripod
      c.strokeStyle = C.faint; seg([-34, 61], [34, 61]);
      c.save(); c.strokeStyle = 'rgba(160,175,220,0.12)'; for (let x = -32; x < 34; x += 3) seg([x, 61], [x - 2, 63.5]); c.restore();
      c.strokeStyle = C.faint; seg(apex, [6, 58]);
      c.strokeStyle = C.line;
      for (const foot of [[-24, 61], [24, 61]]) { const d = [foot[0] - apex[0], foot[1] - apex[1]], L = Math.hypot(d[0], d[1]); const dirL = [d[0] / L, d[1] / L]; c.fillStyle = C.bg; rect(apex, dirL, 1.1, 0, L); c.fill(); c.stroke(); }
      const trayL = [apex[0] + (-24 - apex[0]) * 0.55, apex[1] + (61 - apex[1]) * 0.55], trayR = [apex[0] + (24 - apex[0]) * 0.55, trayL[1]];
      c.strokeStyle = C.soft; seg(trayL, trayR); seg(add(trayL, [0, 0.8]), add(trayR, [0, 0.8]));
      // pier
      c.strokeStyle = C.line; c.fillStyle = C.bg; poly([[-3.5, apex[1]], [3.5, apex[1]], [2.5, head[1] + 2], [-2.5, head[1] + 2]]); c.fill(); c.stroke();
      // polar axis housing (RA) and latitude
      cline(c, ...P(...add(head, pdir, -14)), ...P(...add(head, pdir, 20)), px);
      c.fillStyle = C.bg; c.strokeStyle = C.line; rect(head, pdir, 2.6, -5, 8); c.fill(); c.stroke();
      // declination axis + counterweight
      c.strokeStyle = C.line; rect(head, ddir, 1.9, -1, 9); c.fill(); c.stroke();
      c.strokeStyle = C.soft; seg(head, add(head, ddir, -22));
      c.strokeStyle = C.line; rect(add(head, ddir, -19), ddir, 3.2, -2.4, 2.4); c.fill(); c.stroke();
      // saddle + tube rings
      c.strokeStyle = C.soft;
      for (const k of [-10, 10]) { seg(add(saddle, u, k), add(add(Ctr, u, k), n, -R)); }
      rect(saddle, u, 0.8, -13, 13); c.stroke();

      // light path (behind the tube outline so the walls read on top)
      c.save(); c.strokeStyle = C.accentSoft; c.lineWidth = px; c.setLineDash([5 * px, 4 * px]); c.lineDashOffset = reduce ? 0 : -t * 14 * px;
      for (const k of [-5.6, -3.4, 3.4, 5.6]) {
        const entry = add(add(Ctr, u, 44), n, k), hitP = add(prim, n, k);
        seg(entry, hitP); seg(hitP, add(Q, n, k * 0.12)); seg(add(Q, n, k * 0.12), F);
      }
      c.restore();

      // tube
      c.strokeStyle = C.line; rect(Ctr, u, R, -31, 31); c.stroke();
      c.strokeStyle = C.soft; rect(Ctr, u, R + 0.7, -31, -27); c.stroke(); rect(Ctr, u, R + 0.5, 28.5, 31); c.stroke();
      for (const k of [-10, 10]) { c.strokeStyle = C.soft; rect(add(Ctr, u, k), u, R + 0.9, -1.2, 1.2); c.stroke(); }
      // primary mirror (concave) + cell
      c.strokeStyle = C.accent; c.lineWidth = 1.4 * px;
      c.beginPath(); for (let i = 0; i <= 20; i++) { const k = -6.5 + 13 * i / 20, sag = 0.9 * (1 - (k / 6.5) ** 2); const q = add(add(prim, n, k), u, sag); const [x, y] = P(q[0], q[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      c.lineWidth = px;
      // secondary mirror at 45° + spider vanes
      const m = [(u[0] + n[0]) / Math.SQRT2, (u[1] + n[1]) / Math.SQRT2];
      c.strokeStyle = C.accent; c.lineWidth = 1.6 * px; seg(add(Q, m, -2.1), add(Q, m, 2.1)); c.lineWidth = px;
      c.strokeStyle = C.faint; seg(add(Q, n, -R), add(Q, n, -1.4));
      // focuser, eyepiece, phone
      c.strokeStyle = C.line; c.fillStyle = C.bg;
      rect(Q, n, 2.1, R, R + 4.6); c.fill(); c.stroke();
      rect(Q, n, 1.3, R + 4.6, R + 8); c.fill(); c.stroke();
      c.strokeStyle = C.accent; rect(Q, n, 4.2, R + 8.4, R + 9.4); c.stroke();
      // finder
      c.strokeStyle = C.soft; const fo = add(add(Ctr, u, 12), n, R + 3.2);
      rect(fo, u, 1.3, -5, 5); c.stroke(); seg(add(fo, u, -3), add(add(Ctr, u, 9), n, R)); seg(add(fo, u, 3), add(add(Ctr, u, 15), n, R));
      // centre marks
      cline(c, ...P(...add(Ctr, u, -36)), ...P(...add(Ctr, u, 36)), px);
      c.fillStyle = C.accent; { const [x, y] = P(F[0], F[1]); c.beginPath(); c.arc(x, y, 1.8 * px, 0, TAU); c.fill(); }

      if (detail) {
        // aperture
        const fr = add(Ctr, u, 31), a0 = P(...add(fr, n, R)), a1 = P(...add(fr, n, -R));
        const off = 7 * s; dim(c, a0[0], a0[1], a1[0], a1[1], -off, 'Ø130', px);
        // folded focal length along the lower wall
        const l0 = P(...add(prim, n, -R)), l1 = P(...add(Q, n, -R));
        dim(c, l0[0], l0[1], l1[0], l1[1], 7 * s, '525 + 125 = F 650', px);
        // latitude arc
        const [hx, hy] = P(head[0], head[1]);
        c.save(); c.strokeStyle = C.accentSoft; c.lineWidth = px;
        c.beginPath(); c.arc(hx, hy, 15 * s, Math.PI, Math.PI + phi); c.stroke();
        cline(c, hx - 18 * s, hy, hx + 2 * s, hy, px); c.restore();
        lbl(c, 'φ 12.97° N', hx - 17 * s, hy + 3.5 * s, px, 'left', C.accent, 8.5);
        // callouts
        const pm = P(...add(prim, n, -3.5)); leader(c, pm[0], pm[1], pm[0] - 10 * s, pm[1] + 20 * s, 'PRIMARY · Ø130', px, C.accentSoft);
        const sm = P(...Q); leader(c, sm[0], sm[1], sm[0] + 26 * s, sm[1] + 12 * s, 'SECONDARY · 45°', px, C.accentSoft);
        const ph = P(...add(Q, n, R + 8.9)); leader(c, ph[0], ph[1], ph[0] + 22 * s, ph[1] - 3 * s, 'PHONE · AFOCAL', px);
        const fd = P(...fo); leader(c, fd[0], fd[1], fd[0] + 26 * s, fd[1] - 6 * s, 'FINDER', px);
        const cw = P(...add(head, ddir, -19)); leader(c, cw[0] + 3 * s, cw[1], cw[0] + 22 * s, cw[1] + 6 * s, 'COUNTERWEIGHT', px);
        const pa = P(...add(head, pdir, 6)); leader(c, pa[0], pa[1] + 2 * s, pa[0] - 12 * s, pa[1] + 16 * s, 'POLAR AXIS → NCP', px);
        lbl(c, `ALT ${(elev * 180 / Math.PI).toFixed(1)}°`, cx + 30 * s, cy + 40 * s, px, 'left', C.text, 8.5);
      }
    }
  };
})();
