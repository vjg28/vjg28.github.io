// Art block templates for the Life card comparison. base = path prefix to the site root.
window.ART = (base = '../../') => {
  const photo = (cls, file, alt, cap) =>
    `<div class="art photo ${cls}"><img src="${base}assets/photos/cards/${file}" alt="${alt}" loading="lazy" decoding="async" width="720" height="540"><span class="cap">${cap}</span></div>`;

  const wheel = (cx) => `
      <g transform="translate(${cx} 200)">
        <circle r="31" fill="url(#ws-tyre)"/>
        <circle r="30.4" fill="none" stroke="url(#ws-rim)" stroke-width="1.2"/>
        <circle r="18" fill="#090b12" stroke="rgba(255,255,255,.10)"/>
        <g class="spin" stroke="#8e96ad" stroke-width="2.2" stroke-linecap="round">
          <circle r="16.5" fill="none" stroke="none"/>
          <path d="M0-6V-15M5.7-1.9 14.3-4.6M3.5 4.9 8.8 12.1M-3.5 4.9-8.8 12.1M-5.7-1.9-14.3-4.6"/>
        </g>
        <circle r="5" fill="#d9dde7"/><circle r="2" fill="#4a5168"/>
      </g>`;

  const wheelset = `<div class="art skate wheelset"><svg viewBox="6 48 344 258" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="ws-rim" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd7a8"/><stop offset=".45" stop-color="#ffb260" stop-opacity=".5"/><stop offset="1" stop-color="#ffb260" stop-opacity="0"/></linearGradient>
      <radialGradient id="ws-tyre" cx=".72" cy=".22" r=".95"><stop offset="0" stop-color="#ffb260" stop-opacity=".95"/><stop offset=".28" stop-color="#a0501c"/><stop offset=".62" stop-color="#2a1a14"/><stop offset="1" stop-color="#0b0d14"/></radialGradient>
      <linearGradient id="ws-frame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dbe6"/><stop offset=".18" stop-color="#7d859b"/><stop offset="1" stop-color="#1e2334"/></linearGradient>
      <linearGradient id="ws-boot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a3d"/><stop offset="1" stop-color="#0d1019"/></linearGradient>
      <linearGradient id="ws-line" x1="96" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb260" stop-opacity=".9"/><stop offset="1" stop-color="#ffb260" stop-opacity="0"/></linearGradient>
      <linearGradient id="ws-fade" x1="0" y1="232" x2="0" y2="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="ws-mask"><rect x="0" y="232" width="400" height="80" fill="url(#ws-fade)"/></mask>
    </defs>
    <g class="lines" stroke="url(#ws-line)" stroke-width="1.4" stroke-linecap="round">
      <line x1="92" y1="124" x2="-210" y2="124"/><line x1="84" y1="146" x2="-210" y2="146"/><line x1="80" y1="176" x2="-210" y2="176"/>
      <line x1="80" y1="200" x2="-210" y2="200"/><line x1="80" y1="224" x2="-210" y2="224"/>
    </g>
    <g id="ws-skate">
      <path d="M96 136V124Q96 116 106 116H322Q334 116 334 128V136Z" fill="#141824" stroke="#ffb260" stroke-opacity=".3"/><path d="M104 120H322" stroke="#ffd7a8" stroke-opacity=".5"/>
      <rect x="86" y="138" width="248" height="22" rx="8" fill="url(#ws-frame)"/>
      <path d="M100 156H124L118 200H106ZM164 156H188L182 200H170ZM228 156H252L246 200H234ZM292 156H316L310 200H298Z" fill="#2a3044"/>
      <ellipse cx="144" cy="149" rx="15" ry="4.5" fill="#07090f"/><ellipse cx="208" cy="149" rx="15" ry="4.5" fill="#07090f"/><ellipse cx="272" cy="149" rx="15" ry="4.5" fill="#07090f"/>
      ${wheel(112)}${wheel(176)}${wheel(240)}${wheel(304)}
    </g>
    <line x1="30" y1="232" x2="390" y2="232" stroke="rgba(255,255,255,.08)"/>
    <g mask="url(#ws-mask)"><use href="#ws-skate" transform="matrix(1 0 0 -1 0 464)" opacity=".55"/></g>
  </svg></div>`;

  const track = `<div class="art skate lanes"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="tr-surf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2030"/><stop offset="1" stop-color="#0c0f18"/></linearGradient>
      <filter id="tr-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <path fill-rule="evenodd" fill="url(#tr-surf)" d="M-60 390a480 300 0 1 0 960 0a480 300 0 1 0-960 0ZM190 390a230 145 0 1 0 460 0a230 145 0 1 0-460 0Z"/>
    <g fill="none" stroke="rgba(255,255,255,.12)" stroke-dasharray="6 9">
      <ellipse cx="420" cy="390" rx="280" ry="176"/><ellipse cx="420" cy="390" rx="330" ry="207"/><ellipse cx="420" cy="390" rx="380" ry="238"/><ellipse cx="420" cy="390" rx="430" ry="269"/>
    </g>
    <g fill="none" stroke="rgba(232,236,246,.35)" stroke-width="1.2">
      <ellipse cx="420" cy="390" rx="480" ry="300"/><ellipse cx="420" cy="390" rx="230" ry="145"/>
    </g>
    <g fill="none" stroke-linecap="round">
      <path class="trail" pathLength="1000" d="M115 390A305 191 0 0 1 420 199" stroke="#ffb260" stroke-width="8" filter="url(#tr-glow)" opacity=".7"/>
      <path class="trail" pathLength="1000" d="M115 390A305 191 0 0 1 420 199" stroke="#ffd7a8" stroke-width="2.4"/>
      <path class="trail b" pathLength="1000" d="M15 390A405 254 0 0 1 420 136" stroke="#e3762e" stroke-width="7" filter="url(#tr-glow)" opacity=".55"/>
      <path class="trail b" pathLength="1000" d="M15 390A405 254 0 0 1 420 136" stroke="#ffb260" stroke-width="2"/>
    </g>
  </svg></div>`;

  const bib = `<div class="art skate bib"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <filter id="bib-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".6"/></filter>
      <clipPath id="bib-clip"><rect x="92" y="66" width="216" height="156" rx="7"/></clipPath>
      <linearGradient id="bib-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6efe3"/><stop offset="1" stop-color="#ddd2bf"/></linearGradient>
    </defs>
    <g transform="rotate(-6 200 144)">
      <g filter="url(#bib-shadow)" clip-path="url(#bib-clip)">
        <rect x="92" y="66" width="216" height="156" fill="url(#bib-paper)"/>
        <rect x="92" y="66" width="216" height="32" fill="#ffb260"/>
      </g>
      <text class="sm" x="200" y="87" text-anchor="middle" font-size="13" fill="#3a1d07">Nationals</text>
      <text class="num" x="200" y="180" text-anchor="middle" font-size="76" fill="#17120d">2013</text>
      <text class="sm" x="200" y="206" text-anchor="middle" font-size="10" fill="#7a6a58" font-weight="400">Inline speed skating</text>
      <g fill="none" stroke="#8d93a3" stroke-width="1.6" stroke-linecap="round">
        <path d="M104 110h14m-14 0a3 3 0 0 1 0-6h14"/><path d="M282 110h14m0 0a3 3 0 0 0 0-6h-14"/>
        <path d="M104 212h14m-14 0a3 3 0 0 1 0-6h14"/><path d="M282 212h14m0 0a3 3 0 0 0 0-6h-14"/>
      </g>
    </g>
  </svg></div>`;

  return {
    astro: {
      'moon-wide': { name: 'Moon, whole', note: 'The waxing gibbous from March 2021, whole disc on black. Cleanest, most legible photo in the set.', html: photo('moon', 'moon-wide.jpg', 'The Moon through a small telescope', 'The Moon, March 2021') },
      'moon-close': { name: 'Moon, terminator', note: 'Tighter crop on the craters along the shadow line. More texture, a little softer.', html: photo('moon moon-close', 'moon-close.jpg', 'Craters along the Moon’s terminator', 'The terminator, March 2021') },
      'orion': { name: 'Orion Nebula', note: 'The real M42 frame, brightened. Honest but small and noisy, and it reads closer to the background sky.', html: photo('orion', 'orion.jpg', 'The Orion Nebula through a small telescope', 'Orion Nebula, March 2021') },
    },
    garden: {
      'nightbloom': { name: 'Night bloom', note: 'Dragon fruit flower at night. White and gold on near-black, sits naturally in the dark page.', html: photo('', 'garden-nightbloom.jpg', 'A dragon fruit flower blooming at night', 'Dragon fruit flower, November 2021') },
      'blooms': { name: 'Winter blooms', note: 'Orange kalanchoe and pink chrysanthemums in pots. The most colour, echoes the amber accent.', html: photo('', 'garden-blooms.jpg', 'Orange and pink flowers in pots', 'Winter blooms, December 2021') },
      'harvest': { name: 'Harvest', note: 'A bowl of Barbados cherries from the pots. Says "it worked", but the steel bowl is busy.', html: photo('', 'garden-harvest.jpg', 'A bowl of Barbados cherries', 'Barbados cherries, September 2021') },
    },
    skate: {
      'wheelset': { name: 'Wheel set', note: 'A long four-wheel racing frame lit from behind in amber, wheels spinning, speed lines trailing, floor reflection. Reads instantly as inline racing.', html: wheelset },
      'track': { name: 'Banked turn', note: 'Top-down turn of a racing oval with dashed lanes and two amber light trails sweeping through it.', html: track },
      'bib': { name: 'Race bib', note: 'A pinned bib for the 2013 nationals. Ties to the copy, but more of a prop than an image.', html: bib },
    },
  };
};
