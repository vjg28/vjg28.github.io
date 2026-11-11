// Engineering-drawing style line art, generated from real geometry.
// Usage: <canvas data-bp="cycloid|planetary|exploded|linkage"></canvas>, then Blueprints.init().
// Every mechanism is computed, not traced: true cycloidal disc profile, involute gear teeth,
// correct gear ratios, isometric projection for the exploded view.
(function () {
  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = {
    line: 'rgba(222, 230, 255, 0.88)',
    soft: 'rgba(190, 202, 240, 0.55)',
    faint: 'rgba(160, 175, 220, 0.22)',
    grid: 'rgba(160, 175, 220, 0.06)',
    accent: '#ffb260',
    accentSoft: 'rgba(255, 178, 96, 0.55)',
    bg: '#060914',
    text: 'rgba(200, 210, 240, 0.8)'
  };
  const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

  // ---------- geometry helpers ----------
  const inv = a => Math.tan(a) - a;
  const PA = 20 * Math.PI / 180;

  // Involute gear outline (external or internal), centred at origin, tooth 0 centred on +x
  function gearOutline(z, m, internal = false, steps = 5) {
    const rp = m * z / 2, rb = rp * Math.cos(PA);
    const rTip = internal ? rp - m : rp + m;
    const rRoot = internal ? rp + 1.25 * m : rp - 1.25 * m;
    const half = Math.PI / (2 * z);
    const thetaAt = r => (r <= rb ? 0 : inv(Math.acos(rb / r)));
    // half-angle of solid material at radius r
    const halfAt = r => internal ? half - inv(PA) + thetaAt(r) : half + inv(PA) - thetaAt(r);
    const pts = [];
    const rLo = Math.min(rTip, rRoot), rHi = Math.max(rTip, rRoot);
    for (let k = 0; k < z; k++) {
      const c = k * TAU / z;
      // flank from root to tip (left side), tip land, tip to root (right side)
      const flank = [];
      for (let i = 0; i <= steps; i++) {
        const r = rRoot + (rTip - rRoot) * (i / steps);
        flank.push(r);
      }
      for (const r of flank) { const h = halfAt(Math.min(Math.max(r, rLo), rHi)); pts.push([r * Math.cos(c - h), r * Math.sin(c - h)]); }
      for (let i = flank.length - 1; i >= 0; i--) { const r = flank[i]; const h = halfAt(r); pts.push([r * Math.cos(c + h), r * Math.sin(c + h)]); }
      // root land towards next tooth
      const hRoot = halfAt(rRoot), next = c + TAU / z;
      const a0 = c + hRoot, a1 = next - hRoot;
      for (let i = 1; i < 4; i++) { const a = a0 + (a1 - a0) * i / 4; pts.push([rRoot * Math.cos(a), rRoot * Math.sin(a)]); }
    }
    return pts;
  }

  // Cycloidal disc profile: N ring pins on radius R, pin radius Rr, eccentricity E; disc has N-1 lobes
  function cycloidProfile(N, R, Rr, E, samples = 900) {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples * TAU;
      const psi = Math.atan2(Math.sin((1 - N) * t), R / (E * N) - Math.cos((1 - N) * t));
      const x = R * Math.cos(t) - Rr * Math.cos(t + psi) - E * Math.cos(N * t);
      const y = -R * Math.sin(t) + Rr * Math.sin(t + psi) + E * Math.sin(N * t);
      pts.push([x, y]);
    }
    return pts;
  }

  // ---------- drawing helpers ----------
  function poly(ctx, pts, close = true) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function xform(pts, cx, cy, rot, s = 1) {
    const c = Math.cos(rot), si = Math.sin(rot);
    return pts.map(([x, y]) => [cx + (x * c - y * si) * s, cy + (x * si + y * c) * s]);
  }
  function centerline(ctx, x0, y0, x1, y1, px) {
    ctx.save(); ctx.strokeStyle = C.faint; ctx.lineWidth = px; ctx.setLineDash([14 * px, 4 * px, 2 * px, 4 * px]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
  }
  function centermark(ctx, x, y, r, px) {
    centerline(ctx, x - r, y, x + r, y, px); centerline(ctx, x, y - r, x, y + r, px);
  }
  function label(ctx, text, x, y, px, align = 'left', color = C.text, size = 9) {
    ctx.save(); ctx.fillStyle = color; ctx.font = `${size * px}px ${MONO}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y); ctx.restore();
  }
  function arrowHead(ctx, x, y, ang, px) {
    const L = 6 * px, W = 2.2 * px;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - L * Math.cos(ang) + W * Math.sin(ang), y - L * Math.sin(ang) - W * Math.cos(ang));
    ctx.lineTo(x - L * Math.cos(ang) - W * Math.sin(ang), y - L * Math.sin(ang) + W * Math.cos(ang));
    ctx.closePath(); ctx.fill();
  }
  // Linear dimension between two points, offset perpendicular by `off`
  function dimLinear(ctx, x0, y0, x1, y1, off, text, px) {
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * off, ny = Math.cos(a) * off;
    ctx.save(); ctx.strokeStyle = C.soft; ctx.fillStyle = C.soft; ctx.lineWidth = px;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + nx * 1.15, y0 + ny * 1.15); ctx.moveTo(x1, y1); ctx.lineTo(x1 + nx * 1.15, y1 + ny * 1.15); ctx.stroke();
    const ax = x0 + nx, ay = y0 + ny, bx = x1 + nx, by = y1 + ny;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    arrowHead(ctx, ax, ay, a + Math.PI, px); arrowHead(ctx, bx, by, a, px);
    ctx.translate((ax + bx) / 2, (ay + by) / 2);
    let ta = a; if (ta > Math.PI / 2 || ta < -Math.PI / 2) ta += Math.PI;
    ctx.rotate(ta);
    ctx.fillStyle = C.bg; const w = ctx.measureText ? 0 : 0;
    ctx.font = `${9 * px}px ${MONO}`; const tw = ctx.measureText(text).width + 6 * px;
    ctx.fillRect(-tw / 2, -6 * px, tw, 12 * px);
    ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  // Diameter / radius leader with text
  function leader(ctx, x0, y0, x1, y1, text, px, color = C.soft) {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = px;
    const dir = x1 >= x0 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1 + dir * 26 * px, y1); ctx.stroke();
    arrowHead(ctx, x0, y0, Math.atan2(y0 - y1, x0 - x1), px);
    ctx.restore();
    label(ctx, text, x1 + dir * 30 * px, y1, px, dir > 0 ? 'left' : 'right');
  }
  function balloon(ctx, x, y, n, tx, ty, px) {
    ctx.save(); ctx.strokeStyle = C.soft; ctx.lineWidth = px;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = C.soft; circle(ctx, tx, ty, 1.8 * px); ctx.fill();
    ctx.fillStyle = C.bg; circle(ctx, x, y, 9 * px); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, String(n), x, y + 0.5 * px, px, 'center', C.line, 9);
  }
  function grid(ctx, w, h, px) {
    ctx.save(); ctx.strokeStyle = C.grid; ctx.lineWidth = px;
    const step = 20 * px;
    ctx.beginPath();
    for (let x = step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = step; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke(); ctx.restore();
  }
  // Sheet border with zone marks and a title block; returns the drawable area
  function sheet(ctx, w, h, px, meta, compact) {
    const m = 10 * px;
    ctx.save(); ctx.strokeStyle = C.faint; ctx.lineWidth = px;
    ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
    // zone ticks
    const zones = 6;
    ctx.beginPath();
    for (let i = 1; i < zones; i++) {
      const x = m + (w - 2 * m) * i / zones, y = m + (h - 2 * m) * i / zones;
      ctx.moveTo(x, m); ctx.lineTo(x, m + 5 * px); ctx.moveTo(x, h - m); ctx.lineTo(x, h - m - 5 * px);
      ctx.moveTo(m, y); ctx.lineTo(m + 5 * px, y); ctx.moveTo(w - m, y); ctx.lineTo(w - m - 5 * px, y);
    }
    ctx.stroke();
    let area = { x: m + 14 * px, y: m + 14 * px, w: w - 2 * m - 28 * px, h: h - 2 * m - 28 * px };
    ctx.restore();
    return area;
  }

  // ---------- drawings ----------
  const drawings = {
    // 11:1 cycloidal reducer, front view
    cycloid: {
      meta: { title: 'Cycloidal reducer', no: 'VG-014', scale: '1:1', matl: 'PETG · 6806 BRG' },
      init() {
        const N = 12, R = 40, Rr = 3.2, E = 2.4;
        return { N, R, Rr, E, disc: cycloidProfile(N, R, Rr, E), Rh: 20, rPin: 3, holes: 6 };
      },
      bounds: 60,
      draw(ctx, g, s, cx, cy, px, t, detail) {
        const { N, R, Rr, E, disc, Rh, rPin, holes } = g;
        const th = t * 1.2;                          // input crank angle
        const rot = -th / (N - 1);                    // disc and output rotation
        const dx = cx + E * s * Math.cos(th), dy = cy + E * s * Math.sin(th);
        ctx.lineWidth = px;
        // housing
        ctx.strokeStyle = C.soft;
        circle(ctx, cx, cy, (R + Rr + 9) * s); ctx.stroke();
        circle(ctx, cx, cy, (R + Rr + 2.5) * s); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + TAU / 12; circle(ctx, cx + (R + Rr + 5.8) * s * Math.cos(a), cy + (R + Rr + 5.8) * s * Math.sin(a), 1.6 * s); ctx.stroke(); }
        // pin pitch circle
        ctx.save(); ctx.strokeStyle = C.faint; ctx.setLineDash([10 * px, 3 * px, 2 * px, 3 * px]); circle(ctx, cx, cy, R * s); ctx.stroke();
        circle(ctx, cx, cy, Rh * s); ctx.stroke(); ctx.restore();
        centerline(ctx, cx - (R + 18) * s, cy, cx + (R + 18) * s, cy, px);
        centerline(ctx, cx, cy - (R + 18) * s, cx, cy + (R + 18) * s, px);
        // ring pins
        ctx.strokeStyle = C.line;
        for (let i = 0; i < N; i++) { const a = i * TAU / N; circle(ctx, cx + R * s * Math.cos(a), cy + R * s * Math.sin(a), Rr * s); ctx.stroke(); }
        // disc
        ctx.strokeStyle = C.accent; ctx.lineWidth = 1.3 * px;
        poly(ctx, xform(disc, dx, dy, rot, s)); ctx.stroke();
        ctx.lineWidth = px;
        // eccentric bearing on disc centre
        circle(ctx, dx, dy, 10 * s); ctx.stroke();
        ctx.strokeStyle = C.accentSoft; circle(ctx, dx, dy, 7.5 * s); ctx.stroke();
        // output holes (on disc) and output pins (on output carrier, concentric)
        for (let i = 0; i < holes; i++) {
          const a = rot + i * TAU / holes;
          ctx.strokeStyle = C.accent; circle(ctx, dx + Rh * s * Math.cos(a), dy + Rh * s * Math.sin(a), (rPin + E) * s); ctx.stroke();
          ctx.strokeStyle = C.line; circle(ctx, cx + Rh * s * Math.cos(a), cy + Rh * s * Math.sin(a), rPin * s); ctx.stroke();
        }
        // input shaft with eccentric and key
        ctx.strokeStyle = C.line; circle(ctx, cx, cy, 4 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
        ctx.fillStyle = C.accent; circle(ctx, dx, dy, 1.4 * px); ctx.fill();
        centermark(ctx, dx, dy, 6 * s, px);
        if (detail) {
          leader(ctx, cx + R * s * Math.cos(-0.6), cy + R * s * Math.sin(-0.6), cx + (R + 24) * s, cy - (R + 10) * s, `${N}× Ø${(2 * Rr).toFixed(1)} PIN · PCD ${2 * R}`, px);
          leader(ctx, dx + (R - 5) * s * Math.cos(2.4), dy + (R - 5) * s * Math.sin(2.4), cx - (R + 22) * s, cy - (R + 16) * s, `DISC · ${N - 1} LOBES`, px, C.accentSoft);
          leader(ctx, cx + Rh * s * Math.cos(rot + 0.5 + TAU / holes * 2), cy + Rh * s * Math.sin(rot + 0.5 + TAU / holes * 2), cx - (R + 22) * s, cy + (R + 8) * s, `${holes}× OUTPUT PIN`, px);
          dimLinear(ctx, cx - (R + Rr + 9) * s, cy + (R + Rr + 9) * s, cx + (R + Rr + 9) * s, cy + (R + Rr + 9) * s, 12 * px, `Ø${(2 * (R + Rr + 9)).toFixed(0)}`, px);
          label(ctx, `e = ${E} · RATIO ${N - 1}:1`, cx + (R + 24) * s, cy + (R + 4) * s, px, 'left', C.accent);
          const outDeg = ((-rot * 180 / Math.PI) % 360 + 360) % 360, inDeg = ((th * 180 / Math.PI) % 360 + 360) % 360;
          label(ctx, `IN ${inDeg.toFixed(0).padStart(3, '0')}°  OUT ${outDeg.toFixed(1).padStart(5, '0')}°`, cx + (R + 24) * s, cy + (R + 16) * s, px, 'left', C.text, 8.5);
        }
      }
    },

    // 5:1 planetary set, ring fixed, sun input
    planetary: {
      meta: { title: 'Planetary stage', no: 'VG-021', scale: '2:1', matl: 'PLA+ · M1.2' },
      init() {
        const m = 1.2, Zs = 12, Zp = 18, Zr = 48, n = 3;
        return { m, Zs, Zp, Zr, n, sun: gearOutline(Zs, m), planet: gearOutline(Zp, m), ring: gearOutline(Zr, m, true) };
      },
      bounds: 38,
      draw(ctx, g, s, cx, cy, px, t, detail) {
        const { m, Zs, Zp, Zr, n, sun, planet, ring } = g;
        const rs = m * Zs / 2, rpl = m * Zp / 2, rr = m * Zr / 2, a = rs + rpl;
        const thS = t * 1.0, thC = thS * Zs / (Zs + Zr);
        ctx.lineWidth = px;
        // ring and housing
        ctx.strokeStyle = C.soft; circle(ctx, cx, cy, (rr + 4.5) * s); ctx.stroke();
        ctx.strokeStyle = C.line; poly(ctx, xform(ring, cx, cy, Math.PI / Zr, s)); ctx.stroke();
        centerline(ctx, cx - (rr + 9) * s, cy, cx + (rr + 9) * s, cy, px);
        centerline(ctx, cx, cy - (rr + 9) * s, cx, cy + (rr + 9) * s, px);
        // carrier
        ctx.save(); ctx.strokeStyle = C.faint; ctx.setLineDash([10 * px, 3 * px, 2 * px, 3 * px]); circle(ctx, cx, cy, a * s); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = C.accentSoft;
        ctx.beginPath();
        for (let i = 0; i < n; i++) { const al = thC + i * TAU / n; ctx.moveTo(cx, cy); ctx.lineTo(cx + a * s * Math.cos(al), cy + a * s * Math.sin(al)); }
        ctx.stroke();
        // sun
        ctx.strokeStyle = C.accent; ctx.lineWidth = 1.3 * px; poly(ctx, xform(sun, cx, cy, thS, s)); ctx.stroke(); ctx.lineWidth = px;
        circle(ctx, cx, cy, 2.5 * s); ctx.stroke();
        // planets
        ctx.strokeStyle = C.line;
        for (let i = 0; i < n; i++) {
          const al = thC + i * TAU / n;
          const px0 = cx + a * s * Math.cos(al), py0 = cy + a * s * Math.sin(al);
          const phi0 = (i * TAU / n) + Math.PI - ((i * TAU / n) * Zs + Math.PI) / Zp;
          const phi = phi0 + (thC - i * 0) - (thS - thC) * Zs / Zp;
          poly(ctx, xform(planet, px0, py0, phi, s)); ctx.stroke();
          circle(ctx, px0, py0, 3 * s); ctx.stroke();
          centermark(ctx, px0, py0, 5 * s, px);
        }
        if (detail) {
          leader(ctx, cx + (rs + m) * s * Math.cos(-2.2), cy + (rs + m) * s * Math.sin(-2.2), cx - (rr + 10) * s, cy - (rr - 2) * s, `SUN Z${Zs} · INPUT`, px, C.accentSoft);
          const al = thC; leader(ctx, cx + (a + rpl) * s * Math.cos(al), cy + (a + rpl) * s * Math.sin(al), cx + (rr + 10) * s, cy - (rr - 2) * s, `${n}× PLANET Z${Zp}`, px);
          leader(ctx, cx + (rr + 1) * s * Math.cos(2.4), cy + (rr + 1) * s * Math.sin(2.4), cx - (rr + 10) * s, cy + (rr - 4) * s, `RING Z${Zr} · FIXED`, px);
          label(ctx, `m ${m} · α 20° · i = 1 + ${Zr}/${Zs} = ${1 + Zr / Zs}:1`, cx + (rr + 10) * s, cy + (rr - 4) * s, px, 'left', C.accent);
        }
      }
    },

    // Exploded isometric view of a printed actuator, with balloons and a parts list
    exploded: {
      meta: { title: 'Actuator · exploded', no: 'VG-030', scale: '1:2', matl: 'SEE PARTS LIST' },
      init() { return { disc: cycloidProfile(12, 40, 3.2, 2.4, 300) }; },
      bounds: 120,
      draw(ctx, g, s, cx, cy, px, t, detail) {
        const k = reduce ? 1 : 0.5 - 0.5 * Math.cos(t * 0.6); // explode amount 0..1
        const iso = (x, y, z) => [cx + (x - y) * 0.866 * s, cy + ((x + y) * 0.5 - z) * s];
        const ring = (r, z, n = 72) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; return iso(r * Math.cos(a), r * Math.sin(a), z); });
        // cylinder: bottom ellipse, top ellipse, silhouette lines; painter's fill hides what's behind
        function cylinder(r, z0, h, stroke, inner) {
          const top = ring(r, z0 + h), bot = ring(r, z0);
          const L = iso(-r * 0.7071, r * 0.7071, 0), Rt = iso(r * 0.7071, -r * 0.7071, 0);
          const ox = L[0] - cx, ox2 = Rt[0] - cx;
          ctx.fillStyle = C.bg;
          ctx.beginPath();
          bot.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath(); ctx.fill();
          const yb0 = iso(-r * 0.7071, r * 0.7071, z0)[1], yt0 = iso(-r * 0.7071, r * 0.7071, z0 + h)[1];
          ctx.fillRect(cx + ox, yt0, ox2 - ox, yb0 - yt0);
          poly(ctx, top); ctx.fill();
          ctx.strokeStyle = stroke; ctx.lineWidth = px;
          // visible half of bottom ellipse (front)
          ctx.beginPath();
          for (let i = 0; i <= 36; i++) { const a = Math.PI * 0.25 + i / 36 * Math.PI; const [x, y] = iso(r * Math.cos(-a + Math.PI / 2 * 0 ), r * Math.sin(-a), z0); }
          const front = Array.from({ length: 37 }, (_, i) => { const a = -Math.PI * 0.75 + i / 36 * Math.PI; return iso(r * Math.cos(-a), r * Math.sin(-a), z0); });
          poly(ctx, front, false); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + ox, yb0); ctx.lineTo(cx + ox, yt0); ctx.moveTo(cx + ox2, yb0); ctx.lineTo(cx + ox2, yt0); ctx.stroke();
          poly(ctx, top); ctx.stroke();
          if (inner) { poly(ctx, ring(inner, z0 + h)); ctx.stroke(); }
        }
        const gap = 26 * k;
        // stack from bottom to top: motor, housing, disc, bearing, cover
        const parts = [];
        let z = -70;
        const motorH = 26; parts.push({ n: 5, z0: z, draw: () => { cylinder(34, z0m, motorH, C.line, 6); } }); const z0m = z; z += motorH + gap;
        const housZ = z; z += 10 + gap;
        const discZ = z; z += 5 + gap;
        const brgZ = z; z += 8 + gap;
        const coverZ = z;
        // axis
        const a0 = iso(0, 0, -78), a1 = iso(0, 0, coverZ + 24);
        centerline(ctx, a0[0], a0[1], a1[0], a1[1], px);
        cylinder(34, z0m, motorH, C.line, 6);
        // housing with ring pins on top
        cylinder(48, housZ, 10, C.line, 40);
        ctx.strokeStyle = C.soft;
        for (let i = 0; i < 12; i++) { const ang = i * TAU / 12; poly(ctx, ring(2.5, housZ + 10, 16).map(([x, y]) => [x + (iso(40 * Math.cos(ang), 40 * Math.sin(ang), 0)[0] - cx), y + (iso(40 * Math.cos(ang), 40 * Math.sin(ang), 0)[1] - cy)])); ctx.stroke(); }
        // cycloidal disc (true profile, projected)
        const discTop = g.disc.map(([x, y]) => iso(x, y, discZ + 5));
        const discBot = g.disc.map(([x, y]) => iso(x, y, discZ));
        ctx.fillStyle = C.bg; poly(ctx, discBot); ctx.fill(); poly(ctx, discTop); ctx.fill();
        ctx.strokeStyle = C.accentSoft; poly(ctx, discBot); ctx.stroke();
        ctx.strokeStyle = C.accent; ctx.lineWidth = 1.2 * px; poly(ctx, discTop); ctx.stroke(); ctx.lineWidth = px;
        poly(ctx, ring(10, discZ + 5)); ctx.stroke();
        for (let i = 0; i < 6; i++) { const ang = i * TAU / 6; poly(ctx, ring(5.4, discZ + 5, 20).map(([x, y]) => [x + (iso(20 * Math.cos(ang), 20 * Math.sin(ang), 0)[0] - cx), y + (iso(20 * Math.cos(ang), 20 * Math.sin(ang), 0)[1] - cy)])); ctx.stroke(); }
        // bearing: two races
        cylinder(21, brgZ, 8, C.line, 15);
        // cover
        cylinder(48, coverZ, 6, C.line, 21);
        ctx.strokeStyle = C.soft;
        for (let i = 0; i < 6; i++) { const ang = i * TAU / 6 + TAU / 12; poly(ctx, ring(1.8, coverZ + 6, 14).map(([x, y]) => [x + (iso(45 * Math.cos(ang), 45 * Math.sin(ang), 0)[0] - cx), y + (iso(45 * Math.cos(ang), 45 * Math.sin(ang), 0)[1] - cy)])); ctx.stroke(); }
        if (detail) {
          const bx = cx + 95 * s;
          const items = [[1, coverZ + 6, 48], [2, brgZ + 8, 21], [3, discZ + 5, 38], [4, housZ + 10, 48], [5, z0m + motorH, 34]];
          items.forEach(([n, zz, r]) => { const p = iso(r * 0.7071, -r * 0.7071, zz); balloon(ctx, bx, p[1] - 8 * s, n, p[0], p[1], px); });
          // parts list
          const rows = [['ITEM', 'PART', 'QTY', 'MATL'], ['1', 'COVER', '1', 'PETG'], ['2', '6806 BEARING', '1', 'STEEL'], ['3', 'CYCLOIDAL DISC', '2', 'PETG'], ['4', 'PIN HOUSING', '1', 'PETG'], ['5', 'BLDC 5010', '1', '—']];
          const tx = cx - 150 * s, ty = cy + 52 * s, cw = [22, 92, 28, 42].map(v => v * px), rh = 13 * px;
          ctx.save(); ctx.strokeStyle = C.soft; ctx.lineWidth = px;
          const tw = cw.reduce((a, b) => a + b, 0);
          ctx.fillStyle = C.bg; ctx.fillRect(tx, ty, tw, rh * rows.length);
          ctx.strokeRect(tx, ty, tw, rh * rows.length);
          rows.forEach((r, i) => {
            if (i) { ctx.beginPath(); ctx.moveTo(tx, ty + rh * i); ctx.lineTo(tx + tw, ty + rh * i); ctx.stroke(); }
            let x = tx; r.forEach((cell, j) => { label(ctx, cell, x + 5 * px, ty + rh * i + rh / 2, px, 'left', i ? C.text : C.line, 7.5); x += cw[j]; });
          });
          let x = tx; cw.slice(0, -1).forEach(w => { x += w; ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x, ty + rh * rows.length); ctx.stroke(); });
          ctx.restore();
        }
      }
    },

    // Two-link leg exoskeleton, side view, with live joint angle
    linkage: {
      meta: { title: 'Exo leg · side', no: 'VG-042', scale: '1:5', matl: 'PETG-CF · AL 6061' },
      init() { return { L1: 42, L2: 40 }; },
      bounds: 52,
      draw(ctx, g, s, cx, cy, px, t, detail) {
        const { L1, L2 } = g;
        const hip = 0.25 * Math.sin(t * 0.9);
        const knee = 0.55 + 0.5 * Math.sin(t * 0.9 - 1.1);  // 0.05 .. 1.05 rad flexion
        const hx = cx - 4 * s, hy = cy - 40 * s;
        const a1 = Math.PI / 2 + hip, a2 = a1 - knee;
        const kx = hx + L1 * s * Math.cos(a1), ky = hy + L1 * s * Math.sin(a1);
        const fx = kx + L2 * s * Math.cos(a2), fy = ky + L2 * s * Math.sin(a2);
        function link(x0, y0, x1, y1, w, color) {
          const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * w * s, ny = Math.cos(a) * w * s;
          ctx.strokeStyle = color; ctx.fillStyle = C.bg;
          ctx.beginPath();
          ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx, y1 + ny);
          ctx.arc(x1, y1, w * s, a + Math.PI / 2, a - Math.PI / 2, true);
          ctx.lineTo(x0 - nx, y0 - ny);
          ctx.arc(x0, y0, w * s, a - Math.PI / 2, a + Math.PI / 2, true);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          // lightening slots
          ctx.strokeStyle = C.faint;
          const L = Math.hypot(x1 - x0, y1 - y0) / s;
          for (const f of [0.32, 0.62]) {
            const sx = x0 + (x1 - x0) * f, sy = y0 + (y1 - y0) * f, hl = L * 0.1 * s, ww = w * 0.38 * s;
            ctx.beginPath();
            ctx.moveTo(sx - Math.cos(a) * hl - Math.sin(a) * ww * -1, sy - Math.sin(a) * hl + Math.cos(a) * ww * -1);
            ctx.arc(sx + Math.cos(a) * hl, sy + Math.sin(a) * hl, ww, a - Math.PI / 2, a + Math.PI / 2);
            ctx.arc(sx - Math.cos(a) * hl, sy - Math.sin(a) * hl, ww, a + Math.PI / 2, a + 3 * Math.PI / 2);
            ctx.closePath(); ctx.stroke();
          }
        }
        function cuff(x0, y0, x1, y1, f) {
          const a = Math.atan2(y1 - y0, x1 - x0), mx = x0 + (x1 - x0) * f, my = y0 + (y1 - y0) * f;
          ctx.save(); ctx.translate(mx, my); ctx.rotate(a); ctx.strokeStyle = C.soft; ctx.setLineDash([4 * px, 3 * px]);
          ctx.beginPath(); ctx.ellipse(0, -9 * s, 7 * s, 4 * s, 0, 0, TAU); ctx.stroke(); ctx.restore();
        }
        ctx.lineWidth = px;
        // reference vertical
        centerline(ctx, hx, hy - 12 * s, hx, hy + (L1 + L2 + 4) * s, px);
        link(hx, hy, kx, ky, 4.2, C.line);
        link(kx, ky, fx, fy, 3.6, C.line);
        cuff(hx, hy, kx, ky, 0.55); cuff(kx, ky, fx, fy, 0.5);
        // joints
        ctx.strokeStyle = C.accent; ctx.fillStyle = C.bg;
        for (const [x, y, r] of [[hx, hy, 7], [kx, ky, 6.2]]) { circle(ctx, x, y, r * s); ctx.fill(); ctx.stroke(); circle(ctx, x, y, r * 0.55 * s); ctx.stroke(); centermark(ctx, x, y, (r + 4) * s, px); }
        ctx.strokeStyle = C.line; circle(ctx, fx, fy, 2.4 * s); ctx.stroke();
        // actuator housing at knee (cycloid drive lives here)
        ctx.strokeStyle = C.accentSoft; ctx.setLineDash([3 * px, 3 * px]); circle(ctx, kx, ky, 10 * s); ctx.stroke(); ctx.setLineDash([]);
        if (detail) {
          // knee angle arc
          const r = 16 * s;
          ctx.strokeStyle = C.accent; ctx.fillStyle = C.accent;
          ctx.beginPath(); ctx.arc(kx, ky, r, a2, a1); ctx.stroke();
          ctx.save(); ctx.setLineDash([3 * px, 3 * px]); ctx.strokeStyle = C.accentSoft;
          ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + (r + 8 * s) * Math.cos(a1), ky + (r + 8 * s) * Math.sin(a1)); ctx.stroke(); ctx.restore();
          const am = (a1 + a2) / 2;
          label(ctx, `θ ${(knee * 180 / Math.PI).toFixed(1)}°`, kx + (r + 14 * s) * Math.cos(am), ky + (r + 14 * s) * Math.sin(am), px, 'center', C.accent, 9);
          dimLinear(ctx, hx, hy, kx, ky, -18 * s, `L1 ${L1 * 10}`, px);
          dimLinear(ctx, kx, ky, fx, fy, -18 * s, `L2 ${L2 * 10}`, px);
          leader(ctx, kx + 10 * s * Math.cos(-0.4), ky + 10 * s * Math.sin(-0.4), kx + 34 * s, ky - 20 * s, 'KNEE JOINT · ACTUATED', px, C.accentSoft);
          leader(ctx, hx + 7 * s, hy - 2 * s, hx + 30 * s, hy - 12 * s, 'HIP JOINT', px);
          label(ctx, `HIP ${(hip * 180 / Math.PI).toFixed(1).padStart(5, ' ')}°`, cx - 54 * s, cy + 46 * s, px, 'left', C.text, 8.5);
        }
      }
    }
  };

  // ---------- mounting ----------
  function mount(canvas) {
    const type = canvas.dataset.bp, d = drawings[type];
    if (!d) return;
    const ctx = canvas.getContext('2d');
    const geo = d.init();
    const compact = canvas.hasAttribute('data-compact');
    let w, h, px, visible = !('IntersectionObserver' in window), t = Number(canvas.dataset.t || 1.3), last = 0, raf = 0;
    const size = () => {
      px = Math.min(devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.round(r.width * px));
      h = canvas.height = Math.max(1, Math.round(r.height * px));
      render();
    };
    function render() {
      if (w < 40 * px || h < 40 * px) return; // hidden (e.g. inactive tab): draw once it has a size
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      grid(ctx, w, h, px);
      const area = sheet(ctx, w, h, px, d.meta, compact);
      const detail = !compact && w / px > 420;
      const pad = detail ? 0.76 : 0.86;
      const s = Math.min(area.w, area.h) / (2 * d.bounds) * pad;
      const cx = area.x + area.w * (detail ? 0.44 : 0.5), cy = area.y + area.h * 0.5;
      d.draw(ctx, geo, s, cx, cy, px, t, detail);
    }
    function loop(now) {
      raf = 0;
      if (!visible) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      t += dt * (Number(canvas.dataset.speed) || 1);
      render();
      raf = requestAnimationFrame(loop);
    }
    size();
    addEventListener('resize', size);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        visible = es[0].isIntersecting;
        if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
      }).observe(canvas);
    }
  }

  window.Blueprints = { init: (root = document) => root.querySelectorAll('canvas[data-bp]').forEach(mount), drawings };
})();
