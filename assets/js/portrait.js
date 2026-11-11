// Loads the portrait and cuts out its blue studio backdrop in the browser.
// Resolves to { img, iw, ih, lum, mask, cut } where:
//   lum  – per-pixel luminance 0..1
//   mask – per-pixel "is person" 0..1 (soft edges)
//   cut  – a canvas holding the person with a transparent background
// Replace assets/photos/portrait.jpg with a newer photo on a plain background and this still works;
// a pre-cut PNG with transparency also works (its alpha is used directly).
window.loadPortrait = function loadPortrait(src = 'assets/photos/portrait.jpg') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(build(img));
    img.onerror = reject;
    img.src = src;
  });

  function build(img) {
    const iw = img.naturalWidth, ih = img.naturalHeight, n = iw * ih;
    const oc = document.createElement('canvas'); oc.width = iw; oc.height = ih;
    const o = oc.getContext('2d'); o.drawImage(img, 0, 0);
    const px = o.getImageData(0, 0, iw, ih).data;
    const lum = new Float32Array(n);
    let mask = new Float32Array(n);
    let hasAlpha = false;
    for (let i = 0; i < n; i++) if (px[i * 4 + 3] < 250) { hasAlpha = true; break; }

    for (let i = 0; i < n; i++) {
      const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
      lum[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (hasAlpha) { mask[i] = px[i * 4 + 3] / 255; continue; }
      const blueness = b - Math.max(r, g * 0.92); // backdrop is clearly bluer than skin, hair or clothing
      mask[i] = Math.max(0, Math.min(1, (24 - blueness) / 12));
    }

    if (!hasAlpha) {
      // Keep only the largest connected region so stray backdrop patches disappear
      const label = new Int32Array(n).fill(-1), stack = [];
      let best = -1, bestSize = 0, id = 0;
      for (let s = 0; s < n; s++) {
        if (label[s] !== -1 || mask[s] < 0.5) continue;
        let size = 0; stack.push(s); label[s] = id;
        while (stack.length) {
          const p = stack.pop(); size++;
          const x = p % iw, y = (p / iw) | 0;
          const nb = [x > 0 ? p - 1 : -1, x < iw - 1 ? p + 1 : -1, y > 0 ? p - iw : -1, y < ih - 1 ? p + iw : -1];
          for (const q of nb) if (q >= 0 && label[q] === -1 && mask[q] >= 0.5) { label[q] = id; stack.push(q); }
        }
        if (size > bestSize) { bestSize = size; best = id; }
        id++;
      }
      for (let i = 0; i < n; i++) mask[i] = label[i] === best ? 1 : 0;
      // Fill small holes inside the person (dark shirt buttons, eyes) by flooding the background from the edges
      const outside = new Uint8Array(n);
      for (let x = 0; x < iw; x++) { stack.push(x); stack.push((ih - 1) * iw + x); }
      for (let y = 0; y < ih; y++) { stack.push(y * iw); stack.push(y * iw + iw - 1); }
      while (stack.length) {
        const p = stack.pop();
        if (outside[p] || mask[p] >= 0.5) continue;
        outside[p] = 1;
        const x = p % iw, y = (p / iw) | 0;
        if (x > 0) stack.push(p - 1); if (x < iw - 1) stack.push(p + 1);
        if (y > 0) stack.push(p - iw); if (y < ih - 1) stack.push(p + iw);
      }
      for (let i = 0; i < n; i++) if (!outside[i] && mask[i] < 0.5) mask[i] = 1;
      // Soften edges
      for (let pass = 0; pass < 2; pass++) {
        const m2 = new Float32Array(mask);
        for (let y = 1; y < ih - 1; y++) for (let x = 1; x < iw - 1; x++) {
          let s = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += mask[(y + dy) * iw + x + dx];
          m2[y * iw + x] = s / 9;
        }
        mask = m2;
      }
    }

    const cut = document.createElement('canvas'); cut.width = iw; cut.height = ih;
    const cctx = cut.getContext('2d'), cd = cctx.createImageData(iw, ih);
    for (let i = 0; i < n; i++) {
      cd.data[i * 4] = px[i * 4]; cd.data[i * 4 + 1] = px[i * 4 + 1]; cd.data[i * 4 + 2] = px[i * 4 + 2];
      cd.data[i * 4 + 3] = Math.round(mask[i] * 255);
    }
    cctx.putImageData(cd, 0, 0);
    return { img, iw, ih, lum, mask, cut };
  }
};
