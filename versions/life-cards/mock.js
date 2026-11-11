// Fills the three art slots from ?astro=&garden=&skate=
(() => {
  const art = window.ART('../../'), q = new URLSearchParams(location.search);
  document.querySelectorAll('[data-slot]').forEach(el => {
    const set = art[el.dataset.slot], key = q.get(el.dataset.slot) || Object.keys(set)[0];
    el.outerHTML = set[key].html;
  });
})();
