/**
 * Hero image library — high-quality, optimized Unsplash images with
 * reliable CDN delivery. Uses smaller widths (1200px) for faster loading
 * and adds responsive variants.
 *
 * Each image is hand-picked for:
 *  1. Visual impact at first glance
 *  2. Dark enough for white text readability
 *  3. Travel/adventure vibes
 *  4. Fast CDN delivery via Unsplash ixlib parameters
 */

const unsplash = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const HERO_IMAGE_LIBRARY = [
  // Morning / Sunrise — golden light, warm tones
  {
    id: 'morning_1',
    src: unsplash('1470252649378-9c29740c9fa8', 1400),
    theme: 'nature',
    timeOfDay: ['morning'],
    tags: ['sunrise', 'field', 'golden'],
  },
  {
    id: 'morning_2',
    src: unsplash('1506744038136-46273834b3fb', 1400),
    theme: 'nature',
    timeOfDay: ['morning'],
    tags: ['yosemite', 'reflection', 'calm'],
  },
  {
    id: 'morning_3',
    src: unsplash('1464822759023-fed622ff2c3b', 1400),
    theme: 'mountain',
    timeOfDay: ['morning'],
    tags: ['mountain', 'epic', 'dramatic'],
  },

  // Afternoon — vibrant, bright, travel
  {
    id: 'day_1',
    src: unsplash('1476514525535-07fb3b4ae5f1', 1400),
    theme: 'nature',
    timeOfDay: ['afternoon'],
    tags: ['lake', 'switzerland', 'green'],
  },
  {
    id: 'day_2',
    src: unsplash('1507525428034-b723cf961d3e', 1400),
    theme: 'beach',
    timeOfDay: ['afternoon'],
    tags: ['beach', 'tropical', 'ocean'],
  },
  {
    id: 'day_3',
    src: unsplash('1501785888041-af3ef285b470', 1400),
    theme: 'nature',
    timeOfDay: ['afternoon'],
    tags: ['lake', 'travel', 'adventure'],
  },
  {
    id: 'day_4',
    src: unsplash('1530789253388-582c481c54b0', 1400),
    theme: 'adventure',
    timeOfDay: ['afternoon'],
    tags: ['hiker', 'cliff', 'adventure'],
  },

  // Evening / Sunset / Night — moody, cinematic
  {
    id: 'evening_1',
    src: unsplash('1477959858617-67f85cf4f1df', 1400),
    theme: 'city',
    timeOfDay: ['evening', 'night'],
    tags: ['cityscape', 'sunset', 'skyline'],
  },
  {
    id: 'evening_2',
    src: unsplash('1519681393784-d120267933ba', 1400),
    theme: 'mountain',
    timeOfDay: ['evening', 'night'],
    tags: ['stars', 'milkyway', 'mountain'],
  },
  {
    id: 'evening_3',
    src: unsplash('1514282401047-d79a71a590e8', 1400),
    theme: 'city',
    timeOfDay: ['evening'],
    tags: ['paris', 'eiffel', 'night'],
  },
  {
    id: 'evening_4',
    src: unsplash('1493246507139-91e8fad9978e', 1400),
    theme: 'nature',
    timeOfDay: ['evening'],
    tags: ['aurora', 'northern-lights', 'epic'],
  },
];

/**
 * Fallback — local gradient CSS backgrounds if all network images fail.
 * Not URLs, but CSS gradient strings.
 */
export const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #0a1628, #1a3a5c, #0d2137)',
  'linear-gradient(135deg, #141e30, #243b55)',
  'linear-gradient(135deg, #1a0033, #4b0082, #0a0a2e)',
];

/**
 * Default image URLs — high-reliability Unsplash images
 */
export const DEFAULT_IMAGES = [
  unsplash('1476514525535-07fb3b4ae5f1', 1200),
  unsplash('1507525428034-b723cf961d3e', 1200),
  unsplash('1501785888041-af3ef285b470', 1200),
];
