// Garden page: scroll → time, chapters, readout, plant card, plant list, journal and lightbox.
// Owns the shared state (window.GardenApp); garden3d.js renders the scene from it.
(function () {
  const G = window.GARDEN;
  if (!G) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DAY = 86400000;
  const isVideo = id => G.videos.includes(id);
  const PHOTO = id => `../../assets/photos/soil/${id}.jpg`;
  const THUMB = id => isVideo(id) ? `../../assets/video/soil/${id}.jpg` : `../../assets/photos/soil/thumb/${id}.jpg`;
  const VIDEO = id => `../../assets/video/soil/${id}.mp4`;
  const t0 = Date.parse(G.from + 'T00:00:00Z');
  const toDay = s => Math.round((Date.parse(s + 'T00:00:00Z') - t0) / DAY);
  const MAX = toDay(G.to);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateOf = d => new Date(t0 + d * DAY);
  const fmtMonth = d => { const x = dateOf(d); return `${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`; };
  const fmtDate = s => { const x = new Date(s + 'T00:00:00Z'); return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`; };
  const mediaDate = id => id.slice(-10);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- timing ----------
  const EARLY = toDay('2020-10-15'); // pots for plants started before this stand on the ground from day one, empty
  G.chapters.forEach(c => { c.fromDay = toDay(c.from); c.toDay = toDay(c.to); });
  G.plants.forEach(p => {
    p.startDay = toDay(p.start);
    p.seasonDays = (p.seasons || [[p.start, p.end || G.to]]).map(([a, b]) => [toDay(a), toDay(b)]);
    p.bloomDays = (p.bloom || []).map(([a, b]) => [toDay(a), toDay(b)]);
    p.fruitDays = (p.fruit || []).map(([a, b]) => [toDay(a), toDay(b)]);
    p.harvestDays = (p.harvest || []).map(toDay);
    p.pottedDay = p.potted ? toDay(p.potted) : p.startDay;
    p.potFrom = p.startDay <= EARLY ? 0 : p.startDay - 28;
    if (p.refill) p.refillDay = toDay(p.refill.from);
    p.events.forEach(e => { e.day = toDay(e.date); });
    p.events.sort((a, b) => a.day - b.day);
  });
  const windowAmt = (wins, d, lead = 8, tail = 8) => wins.reduce((m, [a, b]) => Math.max(m, smooth(a - lead, a + 4, d) * (1 - smooth(b - 2, b + tail, d))), 0);

  // State of one plant (and one of its pots) on day d
  function plantState(p, d, pot = {}) {
    const st = { pot: d >= p.potFrom, g: 0, bloom: 0, fruit: 0, ripe: 0, glow: 0, head: 0, jar: 0, r: 0 };
    if (p.refillDay !== undefined) st.r = smooth(p.refillDay, p.refillDay + 75, d);
    if (p.removeAfterEnd && d > p.seasonDays[p.seasonDays.length - 1][1] + 12) st.pot = false;
    if (p.species === 'pineapple' && d < p.pottedDay) {
      st.jar = d >= p.startDay ? 0.25 + 0.75 * smooth(p.startDay, p.pottedDay, d) : 0;
      return st;
    }
    const season = p.seasonDays.find(([a, b]) => d >= a && d <= b + 10);
    if (!season) return st;
    const [a, b] = season;
    const first = a === p.seasonDays[0][0];
    const base = first && p.startApprox ? (p.base ?? 0.5) : 0.03;
    const from = p.species === 'pineapple' ? p.pottedDay - 70 : a;
    const g = base + (1 - base) * smooth(0, p.mature || 120, d - from);
    const leaving = b < MAX ? 1 - smooth(b - 10, b + 8, d) : 1;
    st.g = g * leaving;
    st.bloom = windowAmt(p.bloomDays, d) * leaving;
    const fruiting = p.species === 'pineapple' && !pot.fruits ? 0 : 1;
    st.fruit = windowAmt(p.fruitDays, d, 6, p.species === 'pineapple' ? 2 : 10) * leaving * fruiting;
    if (p.species === 'pineapple') st.bloom *= fruiting;
    const fw = p.fruitDays.find(([x, y]) => d >= x - 6 && d <= y + 10);
    st.ripe = fw ? clamp((d - fw[0]) / Math.max(20, (fw[1] - fw[0]) * 0.6)) : 0;
    st.glow = p.harvestDays.reduce((m, h) => Math.max(m, 1 - clamp(Math.abs(d - h) / 9)), 0);
    if (p.species === 'brassica') st.head = smooth(a + 52, a + 88, d) * leaving;
    return st;
  }

  // ---------- event bus / shared state ----------
  const subs = {};
  const App = window.GardenApp = {
    G, reduce, toDay, MAX, plantState, fmtMonth,
    state: { P: 0, day: 0, chapter: 0, frac: 0, explore: false, selected: null },
    on(ev, fn) { (subs[ev] = subs[ev] || []).push(fn); },
    emit(ev, v) { (subs[ev] || []).forEach(fn => fn(v)); },
    select(id) { App.state.selected = id; App.emit('select', id); }
  };

  // ---------- chapters ----------
  const N = G.chapters.length;
  const chaptersEl = document.getElementById('chapters');
  const mediaBtn = (id, i, group) => `<button type="button" class="m" data-group="${group}" data-i="${i}" aria-label="Open ${isVideo(id) ? 'video' : 'photo'} from ${fmtDate(mediaDate(id))}">${
    isVideo(id)
      ? `<video muted playsinline loop preload="none" poster="${THUMB(id)}" data-src="${VIDEO(id)}"></video><span class="vid">Video</span>`
      : `<img src="${THUMB(id)}" alt="" loading="lazy" decoding="async">`}</button>`;
  const span = c => {
    if (c.id === 'explore') return 'April 2022';
    const a = new Date(c.from + 'T00:00:00Z'), b = new Date(c.to + 'T00:00:00Z');
    const same = a.getUTCFullYear() === b.getUTCFullYear();
    return `${MONTHS[a.getUTCMonth()]}${same ? '' : ' ' + a.getUTCFullYear()} – ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  };
  chaptersEl.innerHTML = G.chapters.map((c, i) => `
    <article class="chap${c.id === 'explore' ? ' last' : ''}" data-i="${i}">
      <div class="chap-card">
        <h2>${esc(c.title)}</h2>
        <p class="chap-when">${span(c)}</p>
        <p>${esc(c.text)}</p>
        ${c.media.length ? `<div class="chap-media">${c.media.map((m, k) => mediaBtn(m, k, 'ch' + i)).join('')}</div>` : ''}
        ${c.id === 'explore' ? '<p class="chap-links"><a href="#plantsTitle">All the plants</a> · <a href="#journalTitle">The full journal</a></p>' : ''}
      </div>
    </article>`).join('');
  chaptersEl.querySelectorAll('.m').forEach(b => b.addEventListener('click', () => {
    const c = G.chapters[+b.dataset.group.slice(2)];
    openLightbox(c.media.map(id => captionFor(id)), +b.dataset.i);
  }));
  const articles = [...chaptersEl.querySelectorAll('.chap')];

  // ---------- readout ----------
  const when = document.getElementById('when'), ruler = document.getElementById('ruler'), rulerNow = document.getElementById('rulerNow');
  (function buildRuler() {
    let html = '';
    for (let y = 2020, m = 5; y < 2022 || (y === 2022 && m <= 3); m++) {
      if (m > 11) { m = 0; y++; }
      const d = toDay(`${y}-${String(m + 1).padStart(2, '0')}-01`);
      if (d < 0 || d > MAX) continue;
      const x = (d / MAX * 100).toFixed(2);
      html += `<span style="left:${x}%" class="${m === 0 ? 'yr' : ''}">${m === 0 ? `<b>${y}</b>` : ''}</span>`;
    }
    ruler.insertAdjacentHTML('afterbegin', html);
  })();

  // ---------- scroll → P ----------
  let lastChapter = -1;
  function computeP() {
    const mid = innerHeight * 0.55;
    let P = 0;
    for (let i = 0; i < articles.length; i++) {
      const r = articles[i].getBoundingClientRect();
      if (r.top <= mid) P = i + clamp((mid - r.top) / r.height);
    }
    return Math.min(P, N - 0.0001);
  }
  let raf = 0;
  function update() {
    raf = 0;
    const P = computeP();
    const i = Math.floor(P), f = P - i;
    const c = G.chapters[i];
    const day = reduce ? c.toDay : c.fromDay + (c.toDay - c.fromDay) * smooth(0.08, 0.92, f);
    Object.assign(App.state, { P: reduce ? i + 0.5 : P, day, chapter: i, frac: f, explore: c.id === 'explore' && f > 0.12 });
    when.textContent = fmtMonth(day);
    rulerNow.style.left = (day / MAX * 100).toFixed(2) + '%';
    if (i !== lastChapter) {
      articles.forEach((a, k) => a.classList.toggle('on', k === i));
      lastChapter = i;
    }
    App.emit('time', App.state);
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // ---------- captions ----------
  const noteFor = {};
  G.plants.forEach(p => p.events.forEach(e => { if (!noteFor[e.media]) noteFor[e.media] = { text: e.text, plant: p.name, date: e.date }; }));
  function captionFor(id) {
    const n = noteFor[id];
    return { id, text: n ? `${fmtDate(n.date)} · ${n.plant}: ${n.text}` : fmtDate(mediaDate(id)) };
  }

  // ---------- plant card ----------
  const card = document.getElementById('card'), cardBody = document.getElementById('cardBody');
  const TYPE = { planted: 'Planted', growth: 'Growing', bloom: 'Flowering', fruit: 'Fruiting', harvest: 'Harvest' };
  function showCard(id) {
    const p = G.plants.find(x => x.id === id);
    if (!p) { card.hidden = true; return; }
    const media = [...new Set(p.events.map(e => e.media))];
    const since = p.startApprox ? `Already growing by ${fmtMonth(p.startDay)}` : `Since ${fmtDate(p.start)}`;
    cardBody.innerHTML = `
      <h2 id="cardTitle">${esc(p.name)}</h2>
      <p class="card-since">${since}${p.end ? ` · until ${fmtMonth(toDay(p.end))}` : ''}</p>
      <p>${esc(p.story)}</p>
      ${p.refill && p.refill.note ? `<p class="card-later">${esc(p.refill.note)}</p>` : ''}
      <ol class="moments">${p.events.map(e => `
        <li><button type="button" data-k="${media.indexOf(e.media)}"><time datetime="${e.date}">${fmtDate(e.date)}</time><span class="mo-type">${TYPE[e.type] || ''}</span><span class="mo-text">${esc(e.text)}</span></button></li>`).join('')}</ol>
      <div class="card-media">${media.map((m, k) => mediaBtn(m, k, 'card')).join('')}</div>`;
    const items = media.map(captionFor);
    cardBody.querySelectorAll('.moments button').forEach(b => b.addEventListener('click', () => openLightbox(items, +b.dataset.k)));
    cardBody.querySelectorAll('.card-media .m').forEach(b => b.addEventListener('click', () => openLightbox(items, +b.dataset.i)));
    card.hidden = false;
    card.scrollTop = 0;
    document.querySelectorAll('.plant-groups button').forEach(b => b.setAttribute('aria-current', String(b.dataset.id === id)));
  }
  App.on('select', id => { if (id) showCard(id); else card.hidden = true; });
  document.getElementById('cardClose').addEventListener('click', () => App.select(null));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden && !lb.open) App.select(null); });

  // ---------- plant list ----------
  const groups = ['Fruit', 'Vegetables', 'Flowers'];
  document.getElementById('plantList').innerHTML = groups.map(g => `
    <div class="pg"><h3>${g}</h3><ul>${G.plants.filter(p => p.group === g).map(p => `
      <li><button type="button" data-id="${p.id}">${esc(p.name)}</button><span>${p.startApprox ? 'by ' : ''}${fmtMonth(p.startDay)}</span></li>`).join('')}</ul></div>`).join('');
  document.querySelectorAll('.plant-groups button').forEach(b => b.addEventListener('click', () => App.select(b.dataset.id)));

  // ---------- journal ----------
  const journal = document.getElementById('journal');
  const num = id => +id.split('-')[1];
  const allMedia = [...G.photos, ...G.videos].sort((a, b) => num(a) - num(b));
  G.seasons.forEach((s, si) => {
    const items = allMedia.filter(id => num(id) >= s.from && num(id) <= s.to);
    if (!items.length) return;
    const sec = document.createElement('section'); sec.className = 'season';
    sec.innerHTML = `<h3>${s.title} <small>${s.sub} · ${items.length}</small></h3>
      <div class="grid">${items.map((id, i) => {
        const n = noteFor[id];
        return `<figure>${mediaBtn(id, i, 'j' + si)}<figcaption>${n ? esc(n.plant) : fmtDate(mediaDate(id))}</figcaption></figure>`;
      }).join('')}</div>`;
    sec.querySelectorAll('.m').forEach(b => b.addEventListener('click', () => openLightbox(items.map(captionFor), +b.dataset.i)));
    // grid videos stay as posters; they play in the lightbox
    sec.querySelectorAll('video').forEach(v => v.removeAttribute('data-src'));
    journal.appendChild(sec);
  });

  // Chapter and card videos play only while visible
  if ('IntersectionObserver' in window && !reduce) {
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }), { threshold: 0.4 });
    const watch = root => root.querySelectorAll('video[data-src]').forEach(v => vio.observe(v));
    watch(chaptersEl);
    App.on('select', () => watch(cardBody));
  }

  // ---------- lightbox ----------
  const lb = document.getElementById('lightbox'), lbMedia = document.getElementById('lbMedia'), lbCap = document.getElementById('lbCap'), lbCount = document.getElementById('lbCount');
  let set = [], idx = 0;
  function paint() {
    const it = set[idx];
    lbMedia.innerHTML = isVideo(it.id)
      ? `<video src="${VIDEO(it.id)}" poster="${THUMB(it.id)}" controls playsinline loop ${reduce ? '' : 'autoplay muted'}></video>`
      : `<img src="${PHOTO(it.id)}" alt="${esc(it.text)}">`;
    lbCap.textContent = it.text;
    lbCount.textContent = `${idx + 1} / ${set.length}`;
  }
  function openLightbox(items, i) {
    set = items; idx = clamp(i | 0, 0, items.length - 1);
    paint();
    if (typeof lb.showModal === 'function') { if (!lb.open) lb.showModal(); } else lb.setAttribute('open', '');
  }
  const close = () => { lbMedia.innerHTML = ''; if (lb.close) lb.close(); else lb.removeAttribute('open'); };
  const step = d => { idx = (idx + d + set.length) % set.length; paint(); };
  document.getElementById('lbPrev').addEventListener('click', () => step(-1));
  document.getElementById('lbNext').addEventListener('click', () => step(1));
  document.getElementById('lbClose').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lb.addEventListener('close', () => { lbMedia.innerHTML = ''; });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
  App.openLightbox = openLightbox;

  update();
})();
