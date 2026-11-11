// The potted garden, reconstructed from Instagram stories (photos in assets/photos/soil/, videos in assets/video/soil/).
// Media are referenced by id ("soil-NNN-YYYY-MM-DD"); originals can replace the files in place later.
// Some ids now hold the owner's original photos in place of the story frame (story frames kept in assets/archive/soil-instagram/);
// ids from soil-100 up are originals that never appeared in a story, dated by what they show.
// Dates come from the date sticker on a frame where there is one, otherwise from the day the story was posted.
// Plant timing: `start` = first appears (seed, cutting or sapling), `startApprox` = already growing before the first photo,
// `end` = removed after its season, `seasons` = repeat sowings, `mature` = days to full size,
// `bloom` / `fruit` = [from, to] windows, `harvest` = dates. Pots are placed in metres on the courtyard floor:
// x runs left → right along the house, z from the house wall (−4.6) towards the front; `ledge` pots sit on the plinth.
window.GARDEN = {
  from: '2020-06-15',
  to: '2022-04-14',

  chapters: [
    {
      id: 'bare', title: 'Bare soil', from: '2020-06-15', to: '2020-08-31',
      text: 'It started with empty pots. I had open space at home but no land, so everything that grew here would have to grow in a container. The first experiment was the simplest one I could think of: the tops of shop-bought pineapples, rooting in glasses of water.',
      media: ['soil-020-2020-12-05', 'soil-002-2020-09-07']
    },
    {
      id: 'seed', title: 'Seedlings', from: '2020-09-01', to: '2020-10-31',
      text: 'By September the trays were full: brinjal, capsicum, chilli, broccoli, cabbage and cauliflower, one seed to a cell. Two dragon fruit cuttings went in against a wooden pole, the pineapples moved into pots, and the first spinach was ready in under two months.',
      media: ['soil-004-2020-09-07', 'soil-024-2020-12-05', 'soil-007-2020-10-29']
    },
    {
      id: 'patch', title: 'The vegetable patch', from: '2020-11-01', to: '2020-12-31',
      text: 'Vegetables grow fast, and they made the place look busy almost overnight. One small pot of tomatoes gave more than twenty-five in a single picking. The cabbages grew huge. Flowers arrived at the same time: petunias, a poinsettia, chrysanthemums.',
      media: ['soil-011-2020-12-05', 'soil-013-2020-12-05', 'soil-035-2020-12-05']
    },
    {
      id: 'winter', title: 'Winter harvests', from: '2021-01-01', to: '2021-03-31',
      text: 'Winter was the payoff. The first cauliflower after a long wait, then cauliflower most mornings, capsicum finally turning yellow, violet cabbage. Some experiments were just for fun, like Himalayan cherry seeds kept in the fridge for six months before they would sprout, or melons and beans for the summer.',
      media: ['soil-037-2021-01-05', 'soil-052-2021-02-20', 'soil-038-2021-01-09']
    },
    {
      id: 'fruit', title: 'The fruit section', from: '2021-04-01', to: '2021-09-30',
      text: 'Fruit plants are slow. They spent most of 2021 just getting bigger. In August the Barbados cherry gave the first fruit the garden had grown, and in September the dragon fruit flowered at night, one huge white bloom at a time.',
      media: ['soil-066-2021-08-13', 'soil-056-2021-08-13', 'soil-074-2021-09-07']
    },
    {
      id: 'forest', title: 'A forest in pots', from: '2021-10-01', to: '2022-04-12',
      text: 'By the second winter it was close to a forest. The dragon fruit gave the sweetest fruit I have eaten, the chrysanthemum came back after a full year, mulberries hung on every branch, and the pineapples I had started from tops in 2020 flowered after a year and a half. In April we picked them.',
      media: ['soil-080-2021-11-23', 'soil-089-2022-01-18', 'soil-099-2022-04-14']
    },
    {
      id: 'explore', title: 'Walk around', from: '2022-04-12', to: '2022-04-12',
      text: 'This is the garden in April 2022, two days before we picked the pineapples. Drag to look around, and click any plant to see its story, photos and videos.',
      media: []
    }
  ],

  plants: [
    // ---------------- fruit ----------------
    {
      id: 'dragonfruit', name: 'Dragon fruit', species: 'dragonfruit', group: 'Fruit',
      story: 'Two cuttings tied to a wooden pole. They climbed for a year, arched over the top, and then flowered at night with blooms bigger than my hand. The fruit was the sweetest I have eaten.',
      start: '2020-09-05', mature: 360,
      bloom: [['2021-08-20', '2021-09-12'], ['2021-11-12', '2021-11-30']],
      fruit: [['2021-09-22', '2021-11-26']],
      harvest: ['2021-11-23'],
      pots: [{ x: -6.3, z: -3.55, kind: 'oct', s: 1.35, label: 'Dragon fruit' }],
      events: [
        { date: '2020-09-05', type: 'planted', media: 'soil-024-2020-12-05', text: 'Two cuttings against a wooden pole' },
        { date: '2020-09-07', type: 'growth', media: 'soil-000-2020-09-07', text: 'Early days' },
        { date: '2020-12-05', type: 'growth', media: 'soil-025-2020-12-05', text: 'Climbing the pole' },
        { date: '2021-08-13', type: 'growth', media: 'soil-067-2021-08-13', text: 'Over the top of the pole' },
        { date: '2021-08-23', type: 'bloom', media: 'soil-069-2021-08-23', text: 'The first buds' },
        { date: '2021-09-01', type: 'bloom', media: 'soil-070-2021-09-01', text: 'A flower bud, nearly there' },
        { date: '2021-09-07', type: 'bloom', media: 'soil-073-2021-09-07', text: 'It flowers at night' },
        { date: '2021-09-07', type: 'bloom', media: 'soil-074-2021-09-07', text: '“It’s happening…”' },
        { date: '2021-09-07', type: 'bloom', media: 'soil-075-2021-09-07', text: 'Full bloom' },
        { date: '2021-09-08', type: 'bloom', media: 'soil-105-2021-09-08', text: 'The morning after' },
        { date: '2021-11-23', type: 'harvest', media: 'soil-080-2021-11-23', text: 'Sweetest dragon fruit ever' },
        { date: '2021-11-23', type: 'harvest', media: 'soil-081-2021-11-23', text: 'Cut open' },
        { date: '2021-11-23', type: 'bloom', media: 'soil-083-2021-11-23', text: 'Another round of flowers' },
        { date: '2021-11-23', type: 'bloom', media: 'soil-084-2021-11-23', text: 'Night bloom' }
      ]
    },
    {
      id: 'pineapple', name: 'Pineapple', species: 'pineapple', group: 'Fruit',
      story: 'Grown from the tops of shop-bought pineapples. They rooted in water, went into pots in September 2020, and took a year and a half to flower. The leaves blushed pink just before. We picked them in April 2022.',
      start: '2020-07-04', mature: 520, potted: '2020-09-07',
      bloom: [['2022-01-04', '2022-02-12']],
      fruit: [['2022-01-26', '2022-04-14']],
      harvest: ['2022-04-14'],
      pots: [
        { x: -5.25, z: -3.65, kind: 'oct', s: 1.0, fruits: true },
        { x: -4.45, z: -3.7, kind: 'oct', s: 1.0 },
        { x: -3.65, z: -3.65, kind: 'oct', s: 1.0, fruits: true },
        { x: -4.85, z: -2.85, kind: 'round', s: 1.05 }
      ],
      events: [
        { date: '2020-07-04', type: 'planted', media: 'soil-020-2020-12-05', text: 'How the pineapples began: tops in water' },
        { date: '2020-07-12', type: 'growth', media: 'soil-021-2020-12-05', text: 'Roots' },
        { date: '2020-09-07', type: 'growth', media: 'soil-022-2020-12-05', text: 'Shifting to containers' },
        { date: '2020-09-07', type: 'growth', media: 'soil-001-2020-09-07', text: '“1.5 years to go”' },
        { date: '2020-12-05', type: 'growth', media: 'soil-023-2020-12-05', text: 'Getting bigger, still a year to go' },
        { date: '2021-08-13', type: 'growth', media: 'soil-068-2021-08-13', text: 'A year in' },
        { date: '2022-01-18', type: 'bloom', media: 'soil-089-2022-01-18', text: 'Surprise, after 1.5 years' },
        { date: '2022-01-18', type: 'bloom', media: 'soil-090-2022-01-18', text: 'Flowering over fifteen days' },
        { date: '2022-02-03', type: 'fruit', media: 'soil-094-2022-02-03', text: 'The fruit forms' },
        { date: '2022-02-03', type: 'fruit', media: 'soil-095-2022-02-03', text: 'Growing' },
        { date: '2022-04-14', type: 'harvest', media: 'soil-097-2022-04-14', text: 'Harvest day' },
        { date: '2022-04-14', type: 'harvest', media: 'soil-098-2022-04-14', text: 'One more' },
        { date: '2022-04-14', type: 'harvest', media: 'soil-099-2022-04-14', text: '“Another one.”' }
      ]
    },
    {
      id: 'mosambee', name: 'Mosambee', species: 'citrus', group: 'Fruit',
      story: 'A sweet lime tree, already fruiting when the garden started.',
      start: '2020-06-15', startApprox: true, mature: 500, base: 0.32, fruitColor: '#c8d14a',
      fruit: [['2020-07-20', '2020-10-30']],
      pots: [{ x: -2.65, z: -3.45, kind: 'round', s: 1.3, label: 'Mosambee' }],
      events: [
        { date: '2020-09-07', type: 'fruit', media: 'soil-002-2020-09-07', text: '“Kuch naya!”' },
        { date: '2021-02-20', type: 'bloom', media: 'soil-104-2021-02-20', text: 'In flower' }
      ]
    },
    {
      id: 'orange', name: 'Orange', species: 'citrus', group: 'Fruit',
      story: 'An orange tree in the fruit section. In February 2022 it was covered in flower buds.',
      start: '2021-03-01', startApprox: true, mature: 600, base: 0.35, flowerColor: '#fbf6e8',
      bloom: [['2022-01-28', '2022-04-14']],
      pots: [{ x: 2.05, z: -3.4, kind: 'big', s: 1.15, label: 'Orange' }],
      events: [
        { date: '2021-08-13', type: 'growth', media: 'soil-066-2021-08-13', text: 'The fruit section' },
        { date: '2022-02-03', type: 'bloom', media: 'soil-096-2022-02-03', text: 'Orange flower buds' }
      ]
    },
    {
      id: 'mulberry', name: 'Mulberry', species: 'mulberry', group: 'Fruit',
      story: 'A mulberry that fruits more than once a year. By the second winter every branch was hung with berries.',
      start: '2020-06-15', startApprox: true, mature: 420, base: 0.28, fruitColor: '#8e1530',
      fruit: [['2020-09-20', '2020-10-22'], ['2021-12-01', '2022-01-28']],
      harvest: ['2020-10-08'],
      pots: [{ x: -1.5, z: -3.5, kind: 'black', s: 1.45, label: 'Mulberry' }],
      events: [
        { date: '2020-09-01', type: 'planted', media: 'soil-100-2020-09-01', text: 'Cuttings in a trough, the first experiment' },
        { date: '2020-10-08', type: 'harvest', media: 'soil-006-2020-10-08', text: 'Mulberries' },
        { date: '2020-12-05', type: 'growth', media: 'soil-027-2020-12-05', text: 'Mulberry' },
        { date: '2021-12-30', type: 'fruit', media: 'soil-087-2021-12-30', text: 'Mulberries again' },
        { date: '2022-01-13', type: 'fruit', media: 'soil-088-2022-01-13', text: 'Berries on every branch' }
      ]
    },
    {
      id: 'barbados', name: 'Barbados cherry', species: 'cherry', group: 'Fruit',
      story: 'The first fruit to grow in the container garden, in August 2021. By September it was cherry season.',
      start: '2020-12-01', startApprox: true, mature: 300, base: 0.35, fruitColor: '#d81f26',
      fruit: [['2021-07-25', '2021-10-08']],
      harvest: ['2021-09-20'],
      pots: [{ x: -0.3, z: -3.35, kind: 'big', s: 1.2, label: 'Barbados cherry' }],
      events: [
        { date: '2021-08-13', type: 'fruit', media: 'soil-056-2021-08-13', text: 'The first fruit to grow in my container garden' },
        { date: '2021-08-13', type: 'fruit', media: 'soil-057-2021-08-13', text: 'Barbados cherry' },
        { date: '2021-08-13', type: 'fruit', media: 'soil-058-2021-08-13', text: 'Another one' },
        { date: '2021-08-13', type: 'fruit', media: 'soil-059-2021-08-13', text: 'Others getting ready' },
        { date: '2021-09-20', type: 'harvest', media: 'soil-076-2021-09-20', text: 'Barbados cherry season' },
        { date: '2021-09-20', type: 'harvest', media: 'soil-077-2021-09-20', text: 'Exotic fruits' }
      ]
    },
    {
      id: 'rambutan', name: 'Rambutan', species: 'rambutan', group: 'Fruit',
      story: 'A rambutan, one of the more hopeful experiments in the fruit section.',
      start: '2021-04-01', startApprox: true, mature: 500, base: 0.3,
      pots: [{ x: 0.95, z: -3.45, kind: 'big', s: 1.15, label: 'Rambootan' }],
      events: [
        { date: '2021-08-13', type: 'growth', media: 'soil-061-2021-08-13', text: 'Rambutan' }
      ]
    },
    {
      id: 'litchi', name: 'Litchi', species: 'litchi', group: 'Fruit',
      story: 'A litchi sapling, potted next to the pineapples with a realistic timeline: “10 years to go.”',
      start: '2020-09-07', startApprox: true, mature: 900, base: 0.25,
      pots: [{ x: -3.35, z: -2.75, kind: 'oct', s: 0.95, label: 'Litchi' }],
      events: [
        { date: '2020-09-07', type: 'planted', media: 'soil-001-2020-09-07', text: '“10 years to go”' }
      ]
    },
    {
      id: 'himalayan-cherry', name: 'Himalayan cherry', species: 'seedling', group: 'Fruit',
      story: 'Grown from seed after six months of cold stratification in the refrigerator.',
      start: '2021-01-09', mature: 700,
      pots: [{ x: 3.0, z: -4.3, kind: 'black', s: 0.75, ledge: true }],
      events: [
        { date: '2021-01-09', type: 'planted', media: 'soil-038-2021-01-09', text: 'From seed, after six months in the fridge' },
        { date: '2021-01-09', type: 'growth', media: 'soil-039-2021-01-09', text: 'Seedling' }
      ]
    },

    // ---------------- vegetables ----------------
    {
      id: 'nursery', name: 'Seed trays', species: 'tray', group: 'Vegetables',
      story: 'Where every vegetable started: brinjal, capsicum, chilli, broccoli, cabbage and cauliflower, one seed to a cell.',
      start: '2020-08-25', end: '2020-12-10', mature: 50, removeAfterEnd: true,
      pots: [{ x: 2.6, z: -0.5, kind: 'tray', s: 1 }],
      events: [
        { date: '2020-09-07', type: 'planted', media: 'soil-004-2020-09-07', text: 'Ongoing: one seed to a cell' },
        { date: '2020-09-07', type: 'growth', media: 'soil-005-2020-09-07', text: 'The first leaves' }
      ]
    },
    {
      id: 'tomato', name: 'Tomatoes', species: 'tomato', group: 'Vegetables',
      story: 'Part of a grow-food-at-home push. One small pot gave more than twenty-five tomatoes in a single picking, with thirty more to come, and it was not even January.',
      start: '2020-09-07', end: '2021-03-15', mature: 80,
      refill: { from: '2021-04-15', species: 'petunia', color: '#f29a2e', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      bloom: [['2020-10-18', '2021-01-31']],
      fruit: [['2020-11-08', '2021-02-12']],
      harvest: ['2020-12-05', '2021-01-04', '2021-01-24'],
      pots: [
        { x: 1.25, z: -1.8, kind: 'round', s: 1.1 },
        { x: 1.95, z: -1.85, kind: 'round', s: 1.1 },
        { x: 2.65, z: -1.8, kind: 'round', s: 1.1 }
      ],
      events: [
        { date: '2020-09-07', type: 'planted', media: 'soil-003-2020-09-07', text: 'Grow food at home' },
        { date: '2020-09-07', type: 'planted', media: 'soil-009-2020-12-05', text: 'Tomato seedlings' },
        { date: '2020-11-30', type: 'fruit', media: 'soil-010-2020-12-05', text: 'Ripening' },
        { date: '2020-12-05', type: 'harvest', media: 'soil-011-2020-12-05', text: '25+ tomatoes, and 30+ more to come' },
        { date: '2021-01-04', type: 'harvest', media: 'soil-036-2021-01-04', text: 'Second harvest' },
        { date: '2021-01-24', type: 'harvest', media: 'soil-047-2021-01-24', text: 'Winter harvest' }
      ]
    },
    {
      id: 'brassicas', name: 'Cauliflower, cabbage & broccoli', species: 'brassica', group: 'Vegetables',
      story: 'The winter beds, twice. Cauliflower, cabbage, broccoli and one violet cabbage from seedlings. The first cauliflower took long enough that I celebrated it.',
      start: '2020-09-30', mature: 85,
      seasons: [['2020-09-30', '2021-03-12'], ['2021-10-20', '2022-04-14']],
      harvest: ['2021-01-18', '2021-02-17', '2021-03-04', '2022-01-23'],
      pots: [
        { x: -5.2, z: -1.75, kind: 'trough', s: 1, crop: ['cauliflower', 'cauliflower', 'cauliflower'] },
        { x: -3.9, z: -1.75, kind: 'trough', s: 1, crop: ['cabbage', 'cabbage', 'cabbage'] },
        { x: -2.6, z: -1.75, kind: 'trough', s: 1, color: 'green', crop: ['broccoli', 'broccoli', 'cauliflower'] },
        { x: -1.3, z: -1.75, kind: 'trough', s: 1, crop: ['cauliflower', 'cabbage', 'cauliflower'] },
        { x: 0.0, z: -1.75, kind: 'trough', s: 1, crop: ['violet', 'cabbage', 'violet'] }
      ],
      events: [
        { date: '2020-09-30', type: 'planted', media: 'soil-012-2020-12-05', text: 'Cauliflower seedlings' },
        { date: '2020-11-23', type: 'growth', media: 'soil-015-2020-12-05', text: 'Broccoli' },
        { date: '2020-11-27', type: 'growth', media: 'soil-013-2020-12-05', text: 'Cabbage' },
        { date: '2020-11-27', type: 'growth', media: 'soil-014-2020-12-05', text: 'Cabbage, unfolding' },
        { date: '2020-12-05', type: 'growth', media: 'soil-016-2020-12-05', text: 'Broccoli stem' },
        { date: '2020-12-05', type: 'growth', media: 'soil-017-2020-12-05', text: 'Cauliflower' },
        { date: '2020-12-05', type: 'growth', media: 'soil-026-2020-12-05', text: 'Violet cabbage' },
        { date: '2021-01-15', type: 'growth', media: 'soil-102-2021-01-15', text: 'Violet cabbages, from above' },
        { date: '2021-01-05', type: 'fruit', media: 'soil-037-2021-01-05', text: 'Finally, the first cauliflower' },
        { date: '2021-01-18', type: 'harvest', media: 'soil-044-2021-01-18', text: 'Harvesting' },
        { date: '2021-01-18', type: 'harvest', media: 'soil-041-2021-01-18', text: 'Morning harvest' },
        { date: '2021-01-18', type: 'harvest', media: 'soil-043-2021-01-18', text: 'Cauliflower and capsicum' },
        { date: '2021-01-24', type: 'growth', media: 'soil-048-2021-01-24', text: 'Me and the cauliflower' },
        { date: '2021-02-17', type: 'harvest', media: 'soil-050-2021-02-17', text: 'A wild cauliflower' },
        { date: '2021-02-17', type: 'harvest', media: 'soil-051-2021-02-17', text: 'Today’s harvest' },
        { date: '2021-03-04', type: 'harvest', media: 'soil-054-2021-03-04', text: 'Violet cabbage' },
        { date: '2022-01-23', type: 'harvest', media: 'soil-093-2022-01-23', text: 'Cauliflower, second winter' }
      ]
    },
    {
      id: 'spinach', name: 'Spinach', species: 'spinach', group: 'Vegetables',
      story: 'Quick, generous and short-lived. The last harvest went into palak paneer.',
      start: '2020-09-10', end: '2021-01-31', mature: 45,
      refill: { from: '2021-10-25', species: 'spinach', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      harvest: ['2020-10-29'],
      pots: [
        { x: -5.2, z: -0.45, kind: 'tray', s: 1.05 },
        { x: -4.2, z: -0.45, kind: 'tray', s: 1.05 }
      ],
      events: [
        { date: '2020-10-29', type: 'harvest', media: 'soil-007-2020-10-29', text: 'First spinach harvest' },
        { date: '2020-10-29', type: 'harvest', media: 'soil-018-2020-12-05', text: 'Last harvest, into palak paneer' },
        { date: '2020-12-05', type: 'growth', media: 'soil-019-2020-12-05', text: 'Sown again for winter' }
      ]
    },
    {
      id: 'lettuce', name: 'Lettuce', species: 'lettuce', group: 'Vegetables',
      story: 'A winter bowl of lettuce.',
      start: '2020-11-25', end: '2021-02-28', mature: 50,
      refill: { from: '2021-11-05', species: 'lettuce', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      harvest: ['2021-01-18'],
      pots: [{ x: -3.25, z: -0.5, kind: 'round', s: 1 }],
      events: [
        { date: '2021-01-18', type: 'harvest', media: 'soil-042-2021-01-18', text: 'Lettuce' }
      ]
    },
    {
      id: 'capsicum', name: 'Capsicum', species: 'capsicum', group: 'Vegetables',
      story: 'Red and yellow capsicum from the seed trays. They stayed green for a long time and then, finally, went yellow.',
      start: '2020-12-01', end: '2021-04-15', mature: 70,
      refill: { from: '2021-09-20', species: 'capsicum', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      fruit: [['2021-01-12', '2021-04-05']],
      harvest: ['2021-03-04'],
      pots: [
        { x: -2.45, z: -0.5, kind: 'round', s: 1 },
        { x: -1.75, z: -0.5, kind: 'round', s: 1 }
      ],
      events: [
        { date: '2020-12-05', type: 'planted', media: 'soil-031-2020-12-05', text: 'Seedlings ready for containers' },
        { date: '2021-01-22', type: 'fruit', media: 'soil-046-2021-01-22', text: 'Yellow capsicum, still green' },
        { date: '2021-02-20', type: 'fruit', media: 'soil-052-2021-02-20', text: 'Finally going yellow' },
        { date: '2021-03-04', type: 'harvest', media: 'soil-053-2021-03-04', text: 'Ready' },
        { date: '2021-03-04', type: 'harvest', media: 'soil-055-2021-03-04', text: 'Coloured capsicum' }
      ]
    },
    {
      id: 'brinjal', name: 'Brinjal', species: 'brinjal', group: 'Vegetables',
      story: 'Just some baingan.',
      start: '2020-10-15', end: '2021-04-01', mature: 85,
      refill: { from: '2021-09-01', species: 'brinjal', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      fruit: [['2021-01-05', '2021-03-15']],
      pots: [{ x: -1.0, z: -0.5, kind: 'black', s: 1.15 }],
      events: [
        { date: '2021-01-22', type: 'fruit', media: 'soil-045-2021-01-22', text: 'Just some baingan' },
        { date: '2021-01-22', type: 'fruit', media: 'soil-103-2021-01-22', text: 'And a green one' }
      ]
    },
    {
      id: 'bhindi', name: 'Bhindi', species: 'bhindi', group: 'Vegetables',
      story: 'Ladies finger, twice: a first try in winter, and a proper plant the next monsoon with pale yellow flowers.',
      start: '2021-01-20', mature: 70,
      refill: { from: '2021-11-10', species: 'kalanchoe', color: '#e8365a', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      seasons: [['2021-01-20', '2021-04-30'], ['2021-07-01', '2021-10-31']],
      bloom: [['2021-02-25', '2021-03-25'], ['2021-08-20', '2021-09-25']],
      fruit: [['2021-09-05', '2021-10-20']],
      pots: [{ x: -0.25, z: -0.5, kind: 'black', s: 1.1 }],
      events: [
        { date: '2021-02-06', type: 'planted', media: 'soil-049-2021-02-06', text: 'Ek patta, do bhindi' },
        { date: '2021-09-01', type: 'bloom', media: 'soil-072-2021-09-01', text: 'Why is it called ladies finger?' }
      ]
    },
    {
      id: 'summer', name: 'Summer experiments', species: 'vine', group: 'Vegetables',
      story: 'In January 2021 the next round went into nursery bags: carrot, muskmelon, French beans, lady finger and watermelon.',
      start: '2021-01-09', end: '2021-06-20', mature: 80,
      refill: { from: '2021-07-10', species: 'rainlily', color: '#f07fb0', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      pots: [
        { x: 3.25, z: -0.5, kind: 'black', s: 0.95 },
        { x: 3.8, z: -0.55, kind: 'black', s: 0.95 },
        { x: 4.35, z: -0.5, kind: 'black', s: 0.95 }
      ],
      events: [
        { date: '2021-01-09', type: 'planted', media: 'soil-040-2021-01-09', text: 'Upcoming summer plants' }
      ]
    },
    {
      id: 'chilli', name: 'Chilli', species: 'chilli', group: 'Vegetables',
      story: 'A chilli plant that was loaded with red chillies by January.',
      start: '2021-09-15', mature: 100,
      fruit: [['2021-12-08', '2022-04-14']],
      harvest: ['2022-01-23'],
      pots: [
        { x: 0.55, z: -0.5, kind: 'round', s: 1 },
        { x: 1.25, z: -0.5, kind: 'round', s: 1 }
      ],
      events: [
        { date: '2022-01-23', type: 'harvest', media: 'soil-091-2022-01-23', text: 'Red chillies' },
        { date: '2022-01-23', type: 'fruit', media: 'soil-092-2022-01-23', text: 'On the plant' }
      ]
    },

    {
      id: 'foliage', name: 'Foliage plants', species: 'foliage', group: 'Flowers',
      story: 'Spider plants and other foliage filled every gap between the pots through 2021, until the courtyard was more green than tile.',
      start: '2021-02-01', startApprox: true, mature: 160, base: 0.15,
      pots: [
        { x: 2.5, z: 1.15, kind: 'round', s: 1.0 }, { x: 3.25, z: 0.85, kind: 'black', s: 1.1 }, { x: 4.1, z: 0.45, kind: 'round', s: 1.1 },
        { x: 5.0, z: 0.25, kind: 'big', s: 1.0 }, { x: 5.95, z: -0.05, kind: 'round', s: 1.0 }, { x: 6.3, z: -2.05, kind: 'black', s: 1.2 },
        { x: -6.4, z: -1.0, kind: 'big', s: 1.0 }, { x: -6.35, z: 0.3, kind: 'round', s: 1.05 }, { x: -6.0, z: 1.6, kind: 'black', s: 1.1 },
        { x: -3.55, z: 1.85, kind: 'round', s: 0.95 }, { x: -1.6, z: 1.8, kind: 'black', s: 1.0 }, { x: 0.6, z: 1.8, kind: 'round', s: 1.0 }
      ],
      events: [
        { date: '2021-11-23', type: 'growth', media: 'soil-078-2021-11-23', text: 'More green than tile' }
      ]
    },

    // ---------------- flowers ----------------
    {
      id: 'chrysanthemum', name: 'Chrysanthemum', species: 'pom', group: 'Flowers', color: '#e5609c',
      story: 'Pink chrysanthemums that bloomed in the first winter, lived through the entire year, and came back with a blast.',
      start: '2020-10-01', mature: 60,
      bloom: [['2020-11-22', '2021-01-25'], ['2021-11-20', '2022-02-25']],
      pots: [
        { x: -5.5, z: 1.0, kind: 'round', s: 1.05 },
        { x: -4.8, z: 1.35, kind: 'round', s: 1.05 },
        { x: -4.1, z: 1.0, kind: 'round', s: 1.05 }
      ],
      events: [
        { date: '2020-12-05', type: 'bloom', media: 'soil-033-2020-12-05', text: 'Chrysanthemum' },
        { date: '2021-12-08', type: 'bloom', media: 'soil-085-2021-12-08', text: 'A full year later, back with a blast' }
      ]
    },
    {
      id: 'petunia', name: 'Petunia & poinsettia', species: 'petunia', group: 'Flowers', color: '#c2187a',
      story: 'The first flowers of the first winter: petunias in pink and a poinsettia that turned red for December.',
      start: '2020-10-15', end: '2021-05-15', mature: 45,
      refill: { from: '2021-10-15', species: 'petunia', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      bloom: [['2020-11-25', '2021-03-31']],
      pots: [
        { x: -3.2, z: 1.2, kind: 'round', s: 0.95 },
        { x: -2.55, z: 0.9, kind: 'round', s: 0.95 },
        { x: -1.3, z: 1.05, kind: 'round', s: 1.05, species: 'poinsettia' }
      ],
      events: [
        { date: '2020-12-05', type: 'bloom', media: 'soil-032-2020-12-05', text: 'Petunia and poinsettia' },
        { date: '2020-12-05', type: 'bloom', media: 'soil-101-2020-12-05', text: 'Petunia, close' }
      ]
    },
    {
      id: 'torenia', name: 'Torenia', species: 'petunia', group: 'Flowers', color: '#7a3fb5',
      story: 'Torenia, the first flower I posted about.',
      start: '2020-10-01', end: '2021-06-01', mature: 45,
      refill: { from: '2021-10-15', species: 'petunia', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      bloom: [['2020-11-10', '2021-03-15']],
      pots: [{ x: -1.95, z: 1.35, kind: 'round', s: 0.9 }],
      events: [
        { date: '2020-12-05', type: 'bloom', media: 'soil-008-2020-12-05', text: 'Gardening stories' }
      ]
    },
    {
      id: 'sage', name: 'Texas sage', species: 'sage', group: 'Flowers',
      story: 'Silver leaves with violet flowers.',
      start: '2020-10-15', startApprox: true, mature: 300, base: 0.4,
      bloom: [['2020-11-20', '2020-12-31'], ['2021-07-15', '2021-09-15']],
      pots: [{ x: 3.15, z: -3.35, kind: 'big', s: 1.1, label: 'Sage' }],
      events: [
        { date: '2020-12-05', type: 'bloom', media: 'soil-030-2020-12-05', text: 'Silver leaves, violet flowers' },
        { date: '2021-08-13', type: 'bloom', media: 'soil-064-2021-08-13', text: 'With the hibiscus' }
      ]
    },
    {
      id: 'hibiscus', name: 'Hibiscus & lantana', species: 'hibiscus', group: 'Flowers',
      story: 'An orange hibiscus with flowers like roses, yellow lantana and a blood lily, all in the same August.',
      start: '2021-03-01', startApprox: true, mature: 200, base: 0.3,
      bloom: [['2021-07-15', '2022-04-14']],
      pots: [
        { x: 4.75, z: -1.15, kind: 'big', s: 1.05 },
        { x: 5.75, z: -1.25, kind: 'trough', s: 0.7, species: 'lantana' },
        { x: 3.75, z: -1.35, kind: 'black', s: 0.95, species: 'bloodlily' }
      ],
      events: [
        { date: '2021-08-13', type: 'bloom', media: 'soil-065-2021-08-13', text: 'Hibiscus, lantana and a blood lily' }
      ]
    },
    {
      id: 'rainlily', name: 'Rain lily', species: 'rainlily', group: 'Flowers', color: '#ea6fa8',
      story: 'Rain lilies, true to their name, flowering in the monsoon.',
      start: '2021-05-01', mature: 70,
      bloom: [['2021-07-20', '2021-09-10']],
      pots: [
        { x: 3.6, z: -2.4, kind: 'black', s: 1 },
        { x: 4.2, z: -2.6, kind: 'black', s: 1 }
      ],
      events: [
        { date: '2021-08-13', type: 'bloom', media: 'soil-060-2021-08-13', text: 'Rain lily' }
      ]
    },
    {
      id: 'rajnigandha', name: 'Rajnigandha & curcuma', species: 'tuberose', group: 'Flowers',
      story: 'Rajnigandha sending up tall white flower spikes, next to a curcuma.',
      start: '2021-04-15', mature: 100,
      bloom: [['2021-08-01', '2021-09-30']],
      pots: [
        { x: 4.9, z: -2.35, kind: 'round', s: 1.1, label: 'Rajnigandha' },
        { x: 5.6, z: -2.55, kind: 'round', s: 1.1, species: 'curcuma', label: 'Curcuma' }
      ],
      events: [
        { date: '2021-08-13', type: 'bloom', media: 'soil-062-2021-08-13', text: 'Rajnigandha and curcuma' }
      ]
    },
    {
      id: 'cosmos', name: 'Cosmos', species: 'cosmos', group: 'Flowers', color: '#f08a1c',
      story: 'Orange cosmos in nursery pots along the wall.',
      start: '2021-06-15', end: '2021-11-30', mature: 55,
      refill: { from: '2021-12-05', species: 'pom', color: '#f4c63f', note: 'In the reconstruction these pots are replanted after the season; the garden rarely sat empty for long.' },
      bloom: [['2021-07-30', '2021-10-20']],
      pots: [
        { x: 4.6, z: -4.3, kind: 'black', s: 0.8, ledge: true },
        { x: 5.2, z: -4.3, kind: 'black', s: 0.8, ledge: true }
      ],
      events: [
        { date: '2021-08-13', type: 'bloom', media: 'soil-063-2021-08-13', text: 'Cosmos' }
      ]
    },
    {
      id: 'dahlia', name: 'Dahlias', species: 'dahlia', group: 'Flowers', color: '#d9384a',
      story: 'Dahlias for the second winter.',
      start: '2021-08-15', mature: 75,
      bloom: [['2021-11-05', '2022-01-25']],
      pots: [
        { x: 1.0, z: 1.2, kind: 'round', s: 1.05 },
        { x: 1.7, z: 0.95, kind: 'round', s: 1.05 }
      ],
      events: [
        { date: '2021-11-23', type: 'bloom', media: 'soil-082-2021-11-23', text: 'Dahlias' }
      ]
    },
    {
      id: 'kalanchoe', name: 'Winter blooms', species: 'kalanchoe', group: 'Flowers', color: '#f2581e',
      story: 'Kalanchoe in orange and the purple flowers behind them: the second winter, in full colour.',
      start: '2021-09-01', mature: 70,
      bloom: [['2021-11-25', '2022-04-14']],
      pots: [
        { x: -0.5, z: 1.2, kind: 'round', s: 1.1 },
        { x: 0.25, z: 0.95, kind: 'round', s: 1.1, color: '#9b4fc0' }
      ],
      events: [
        { date: '2021-12-08', type: 'bloom', media: 'soil-086-2021-12-08', text: 'Winter blooms' }
      ]
    }
  ],

  // Photo journal, grouped by season (ranges by media id number, i.e. story order).
  seasons: [
    { title: 'Monsoon 2020', sub: 'The first pots', from: 0, to: 7 },
    { title: 'December 2020', sub: 'The first big update', from: 8, to: 35 },
    { title: 'Winter 2020–21', sub: 'Harvests', from: 36, to: 55 },
    { title: 'Monsoon 2021', sub: 'The fruit section', from: 56, to: 77 },
    { title: 'Winter 2021–22', sub: 'Blooms, mulberries, a pineapple flower', from: 78, to: 96 },
    { title: 'April 2022', sub: 'Picking the pineapples', from: 97, to: 99 },
    { title: 'From the originals', sub: 'Photos that never made it into a story', from: 100, to: 199 }
  ]
};

// Every photo in assets/photos/soil/ and every video in assets/video/soil/, by id.
window.GARDEN.photos = ["soil-000-2020-09-07","soil-001-2020-09-07","soil-002-2020-09-07","soil-003-2020-09-07","soil-004-2020-09-07","soil-005-2020-09-07","soil-006-2020-10-08","soil-007-2020-10-29","soil-008-2020-12-05","soil-009-2020-12-05","soil-010-2020-12-05","soil-011-2020-12-05","soil-012-2020-12-05","soil-013-2020-12-05","soil-014-2020-12-05","soil-015-2020-12-05","soil-016-2020-12-05","soil-017-2020-12-05","soil-018-2020-12-05","soil-019-2020-12-05","soil-020-2020-12-05","soil-021-2020-12-05","soil-022-2020-12-05","soil-023-2020-12-05","soil-024-2020-12-05","soil-025-2020-12-05","soil-026-2020-12-05","soil-027-2020-12-05","soil-028-2020-12-05","soil-029-2020-12-05","soil-030-2020-12-05","soil-031-2020-12-05","soil-032-2020-12-05","soil-033-2020-12-05","soil-034-2020-12-05","soil-035-2020-12-05","soil-036-2021-01-04","soil-038-2021-01-09","soil-039-2021-01-09","soil-041-2021-01-18","soil-042-2021-01-18","soil-043-2021-01-18","soil-045-2021-01-22","soil-046-2021-01-22","soil-047-2021-01-24","soil-048-2021-01-24","soil-049-2021-02-06","soil-050-2021-02-17","soil-051-2021-02-17","soil-054-2021-03-04","soil-055-2021-03-04","soil-056-2021-08-13","soil-057-2021-08-13","soil-058-2021-08-13","soil-059-2021-08-13","soil-060-2021-08-13","soil-061-2021-08-13","soil-062-2021-08-13","soil-063-2021-08-13","soil-064-2021-08-13","soil-065-2021-08-13","soil-066-2021-08-13","soil-067-2021-08-13","soil-068-2021-08-13","soil-069-2021-08-23","soil-070-2021-09-01","soil-071-2021-09-01","soil-072-2021-09-01","soil-073-2021-09-07","soil-074-2021-09-07","soil-075-2021-09-07","soil-076-2021-09-20","soil-077-2021-09-20","soil-078-2021-11-23","soil-079-2021-11-23","soil-080-2021-11-23","soil-081-2021-11-23","soil-082-2021-11-23","soil-083-2021-11-23","soil-084-2021-11-23","soil-085-2021-12-08","soil-086-2021-12-08","soil-087-2021-12-30","soil-090-2022-01-18","soil-091-2022-01-23","soil-092-2022-01-23","soil-093-2022-01-23","soil-095-2022-02-03","soil-100-2020-09-01","soil-101-2020-12-05","soil-102-2021-01-15","soil-103-2021-01-22","soil-104-2021-02-20","soil-105-2021-09-08"];
window.GARDEN.videos = ["soil-037-2021-01-05","soil-040-2021-01-09","soil-044-2021-01-18","soil-052-2021-02-20","soil-053-2021-03-04","soil-088-2022-01-13","soil-089-2022-01-18","soil-094-2022-02-03","soil-096-2022-02-03","soil-097-2022-04-14","soil-098-2022-04-14","soil-099-2022-04-14"];
