// Sunrise lab: one parameterised copy of the footer sunrise() so variants can be compared side by side.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = () => Math.min(devicePixelRatio || 1, 2);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const fit = c => {
    const d = DPR(), r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d));
    return d;
  };
  const visible = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
  const narrow = () => innerWidth < 640;
  const pin = new URLSearchParams(location.search).get('rise');

  window.labSunrise = O => {
    const c = document.getElementById('sunrise'), contact = document.getElementById('contact');
    const ctx = c.getContext('2d');
    let rise = pin != null ? +pin : 0;
    const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
    const profile = (n, rough) => { const p = []; let v = 0.5; for (let i = 0; i <= n; i++) { v += (rnd() - 0.5) * rough; v = Math.min(0.95, Math.max(0.05, v)); p.push(v); } return p; };
    const layers = [
      { base: 0.72, amp: 0.20, pts: profile(14, 0.9), col: [62, 38, 52], haze: 0.75, drift: 0.02, rim: O.rim[0] },
      { base: 0.82, amp: 0.13, pts: profile(11, 0.9), col: [28, 18, 30], haze: 0.45, drift: 0.05, rim: O.rim[1] },
      { base: 0.92, amp: 0.08, pts: profile(9, 0.8), col: [6, 5, 11], haze: 0.0, drift: 0.09, rim: O.rim[2] },
    ];
    const ridgeY = (L, x, H) => {
      const f = clamp(x) * (L.pts.length - 1), i = Math.floor(f), t = f - i;
      const a = L.pts[i], b = L.pts[Math.min(i + 1, L.pts.length - 1)];
      const k = (1 - Math.cos(t * Math.PI)) / 2;
      let v = a + (b - a) * k;
      if (L.seat) { const q = (x - L.seat.x) / L.seat.w, w = Math.exp(-q * q); v += (L.seat.v - v) * w * 0.85; }
      return H * (L.base - v * L.amp);
    };
    // smooth falloff, zero slope at the rim, so a radial gradient never shows an edge
    const fall = (t, k) => Math.exp(-k * t) * (1 - t * t) ** 2;
    const softStops = (g, rgb, a, k, from = 0) => {
      for (let i = 0; i <= 20; i++) { const t = i / 20; g.addColorStop(from + (1 - from) * t, `rgba(${rgb},${(a * fall(t, k)).toFixed(4)})`); }
    };
    const soft = (x, y, R, ex, rgb, a, k) => {
      if (a < 0.003 || R < 1) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(ex, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      softStops(g, rgb, a, k);
      ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.restore();
    };
    // faint grain added on top hides 8-bit banding in the dark gradients
    const grain = document.createElement('canvas'); grain.width = grain.height = 128;
    { const gx = grain.getContext('2d'), id = gx.createImageData(128, 128);
      for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 4 | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      gx.putImageData(id, 0, 0); }
    let grainPat = null;
    const sunCan = document.createElement('canvas'), sctx = sunCan.getContext('2d');
    const rayCan = document.createElement('canvas'), rctx = rayCan.getContext('2d');
    const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

    // sun x: the lowest notch of the far ridge near the target column
    let sunX = null, sunXFor = '';
    const pickX = (W, H) => {
      const key = W + 'x' + H + narrow();
      if (key === sunXFor) return sunX;
      layers[0].seat = null;
      const c0 = narrow() ? 0.5 : O.x, span = narrow() ? 0.08 : 0.06;
      let best = c0, by = -1;
      for (let x = c0 - span; x <= c0 + span; x += 0.002) { const y = ridgeY(layers[0], x, H); if (y > by) { by = y; best = x; } }
      sunXFor = key; sunX = O.notch ? best : c0;
      // flatten the far ridge into a gentle saddle where the sun sits, so it crests evenly
      if (O.seat) { layers[0].seat = null; const sr0 = Math.min(W, H) * (narrow() ? O.sizeN : O.size);
        const raw = ridgeY(layers[0], sunX, H); layers[0].seat = { x: sunX, w: sr0 * O.seat / W, v: (layers[0].base - raw / H) / layers[0].amp - 0.04 }; }
      return sunX;
    };

    const draw = now => {
      const W = c.width, H = c.height, d = W / Math.max(1, c.clientWidth), time = (now || 0) / 1000;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      // sky warming towards the horizon
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(4,6,13,0)');
      g.addColorStop(0.45, `rgba(${24 + rise * 30 | 0},${16 + rise * 12 | 0},${34 + rise * 6 | 0},${0.3 + rise * 0.35})`);
      g.addColorStop(0.72, `rgba(${80 + rise * 110 | 0},${40 + rise * 46 | 0},${40 + rise * 4 | 0},${0.5 + rise * 0.4})`);
      g.addColorStop(1, `rgba(${130 + rise * 110 | 0},${62 + rise * 50 | 0},${36},1)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      const sx = W * pickX(W, H);
      const sr = Math.min(W, H) * (narrow() ? O.sizeN : O.size);
      let horizon = 0; for (let k = -2; k <= 2; k++) horizon += ridgeY(layers[0], (sx + k * sr * 0.4) / W, H) / 5;
      const sy = horizon + sr * O.start - rise * sr * (O.start - O.end);
      const lit = clamp(1 - (sy - horizon) / sr, 0, 2) / 2;          // 0 hidden .. 1 fully up
      const glowA = Math.min(1, 0.25 + lit * 1.4) * (0.5 + rise * 0.5);

      // wide warm wash over the horizon, flattened into an ellipse
      soft(sx, horizon, Math.max(W, H) * O.washR, O.washEx, '255,150,80', O.wash * glowA, 1.6);
      // rays on a quarter-size canvas, scaled up so their edges come out soft
      if (O.rays && lit > 0) {
        const RS = 4;
        rayCan.width = Math.ceil(W / RS); rayCan.height = Math.ceil(H / RS);
        rctx.setTransform(1 / RS, 0, 0, 1 / RS, 0, 0);
        rctx.globalCompositeOperation = 'lighter';
        const N = narrow() ? Math.round(O.rays * 0.7) : O.rays, Rm = Math.hypot(W, H) * O.rayLen, step = (Math.PI + 2 * O.rayOver) / N;
        for (let i = 0; i < N; i++) {
          const ang = -Math.PI - O.rayOver + (i + 0.5) * step + (hash(i) - 0.5) * step * 0.5;
          const len = Rm * (O.alt ? (i % 2 ? 0.55 : 1) : 0.7 + 0.3 * hash(i + 40));
          const w = step * O.rayW * (0.7 + 0.6 * hash(i + 90));
          const up = Math.max(0, Math.sin(-ang));
          const a = O.rayA * lit * (0.8 + 0.2 * Math.sin(time * 0.35 + i * 1.9)) * (0.55 + 0.45 * up);
          const rg = rctx.createRadialGradient(sx, sy, sr * 0.9, sx, sy, len);
          softStops(rg, '255,200,140', 1, 2.2);
          rctx.fillStyle = rg;
          for (const k of [1, 0.55, 0.25]) {
            rctx.globalAlpha = a * 0.4;
            rctx.beginPath(); rctx.moveTo(sx, sy);
            rctx.lineTo(sx + Math.cos(ang - w * k) * len, sy + Math.sin(ang - w * k) * len);
            rctx.lineTo(sx + Math.cos(ang + w * k) * len, sy + Math.sin(ang + w * k) * len);
            rctx.closePath(); rctx.fill();
          }
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(rayCan, 0, 0, rayCan.width * RS, rayCan.height * RS); ctx.restore();
      }
      // stacked soft glows: corona, then a tighter bloom
      soft(sx, sy, sr * O.coronaR, O.coronaEx, '255,176,96', O.corona * glowA, 2.4);
      soft(sx, sy, sr * 2.6, 1, '255,226,180', O.bloom * glowA, 3.2);

      // the disc, warmer towards the ridge, with a feathered edge
      {
        const f = 1.1 * d, S = Math.ceil((sr + f) * 2 + 2), cx = S / 2;
        sunCan.width = sunCan.height = S;
        const e = (sr - f) / (sr + f);
        const dg = sctx.createRadialGradient(cx, cx, 0, cx, cx, sr + f);
        dg.addColorStop(0, '#fff8ea'); dg.addColorStop(0.6 * e, '#ffefcf'); dg.addColorStop(0.92 * e, '#ffd9a0');
        dg.addColorStop(e, 'rgba(255,196,128,1)'); dg.addColorStop(1, 'rgba(255,196,128,0)');
        sctx.fillStyle = dg; sctx.fillRect(0, 0, S, S);
        sctx.globalCompositeOperation = 'source-atop';
        const top = cx - sr, hz = cx + (horizon - sy);
        const vg = sctx.createLinearGradient(0, top, 0, Math.max(top + 1, hz));
        const warm = O.warm * (1 - rise * 0.3);
        vg.addColorStop(0, 'rgba(255,140,60,0)'); vg.addColorStop(0.55, `rgba(255,128,56,${warm * 0.45})`); vg.addColorStop(1, `rgba(240,86,40,${warm})`);
        sctx.fillStyle = vg; sctx.fillRect(0, 0, S, S);
        ctx.drawImage(sunCan, sx - cx, sy - cx);
      }

      // ridges, far to near; the ones facing the sun catch a lit rim
      layers.forEach((L, li) => {
        const shift = (1 - rise) * L.drift * H, stepX = Math.max(3, W / 300);
        const pts = []; for (let x = 0; x <= W + stepX; x += stepX) pts.push([x, ridgeY(L, x / W, H) + shift]);
        ctx.beginPath(); ctx.moveTo(0, H); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(W, H); ctx.closePath();
        const top = H * (L.base - L.amp) + shift;
        const lg = ctx.createLinearGradient(0, top, 0, H);
        const [r, gg, b] = L.col, wm = L.haze * (0.4 + rise * 0.6);
        const lift = O.lift ?? 90; lg.addColorStop(0, `rgb(${r + lift * wm | 0},${gg + lift * 0.55 * wm | 0},${b + lift * 0.22 * wm | 0})`);
        lg.addColorStop(0.35, `rgb(${r},${gg},${b})`);
        lg.addColorStop(1, `rgb(${Math.max(0, r - 10)},${Math.max(0, gg - 6)},${Math.max(4, b - 6)})`);
        ctx.fillStyle = lg; ctx.fill();
        if (L.rim > 0) {
          ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
          const ra = L.rim * glowA, R = Math.max(W, H) * O.rimR;
          // light bleeding over the crest close to the sun
          soft(sx, horizon + shift, R * 0.6, 1.6, '255,150,90', ra * 0.22, 2.2);
          ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
          softStops(sg, '255,196,130', ra, 2.0);
          ctx.strokeStyle = sg; ctx.lineWidth = O.rimW * d; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.restore();
        }
        if (li === 0 && O.veil) soft(sx, horizon + shift, Math.max(W, H) * 0.5, 1.8, '255,160,110', O.veil * glowA, 2.0);
        if (li === 2) return;
        const mist = ctx.createLinearGradient(0, ridgeY(L, 0.5, H) + shift, 0, H);
        mist.addColorStop(0, 'rgba(255,170,120,0)'); mist.addColorStop(0.5, `rgba(180,110,110,${0.10 + rise * 0.08})`); mist.addColorStop(1, 'rgba(180,110,110,0)');
        ctx.fillStyle = mist; ctx.fillRect(0, top, W, H - top);
      });
      grainPat = grainPat || ctx.createPattern(grain, 'repeat');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    };
    const frame = now => {
      if (visible(c)) {
        if (pin == null) {
          const r = contact.getBoundingClientRect();
          // 1 once the whole footer is on screen (or it fills the viewport)
          const target = clamp((innerHeight - r.top) / Math.min(innerHeight, r.height));
          rise += reduce ? (target - rise) : (target - rise) * 0.06;
        }
        draw(now);
        const o = document.getElementById('riseOut'); if (o) o.textContent = rise.toFixed(2);
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    const resize = () => { fit(c); draw(performance.now()); };
    resize(); addEventListener('resize', resize);
    if (reduce) addEventListener('scroll', () => frame(performance.now()), { passive: true });
    frame(performance.now());
  };
})();
