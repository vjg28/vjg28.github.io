(() => {
  const art = window.ART('../../');
  const pick = { astro: 'moon-wide', garden: 'nightbloom', skate: 'wheelset' };
  const kind = { astro: 'sky-panel', garden: 'soil-panel', skate: 'speed-panel' };
  document.querySelectorAll('[data-group]').forEach(row => {
    const g = row.dataset.group;
    row.innerHTML = Object.entries(art[g]).map(([k, v]) =>
      `<article class="panel ${kind[g]}">${v.html}<div class="txt"><h3>${v.name}${k === pick[g] ? ' <em>Applied</em>' : ''}</h3><p>${v.note}</p></div></article>`).join('');
  });
  const fit = () => document.querySelectorAll('.desk').forEach(d => {
    const f = d.querySelector('iframe'), s = d.clientWidth / 1240;
    f.style.transform = `scale(${s})`; d.style.height = `${726 * s}px`;
  });
  addEventListener('resize', fit); fit();
})();
