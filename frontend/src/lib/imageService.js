import { HERO_IMAGE_LIBRARY, DEFAULT_IMAGES, FALLBACK_GRADIENTS } from '../constants/heroImages';

const STORAGE_KEY_HISTORY = 'vegaa_hero_history';

/**
 * Determine current time of day context
 */
const getTimeContext = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

/**
 * Shuffle array (Fisher-Yates)
 */
const shuffle = (array) => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Preload an image URL with a timeout.
 * Returns the URL on success or null on failure.
 */
const preloadWithTimeout = (url, timeoutMs = 4000) =>
  new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(null);
    }, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(url);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });

/**
 * Get curated hero images for the current session.
 * Preloads each image. If network images fail, returns CSS gradient strings
 * from FALLBACK_GRADIENTS so the hero NEVER shows a blank/black screen.
 *
 * @param {number} count Number of images to return
 * @returns {Array<{type: 'image'|'gradient', value: string}>}
 */
export const getDynamicHeroImages = (count = 4) => {
  const timeContext = getTimeContext();

  // Prioritise time-relevant images
  let relevant = shuffle(
    HERO_IMAGE_LIBRARY.filter((img) => img.timeOfDay.includes(timeContext))
  );
  const others = shuffle(
    HERO_IMAGE_LIBRARY.filter((img) => !img.timeOfDay.includes(timeContext))
  );
  const pool = [...relevant, ...others];

  // Avoid recently shown
  let history = [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_HISTORY);
    if (stored) history = JSON.parse(stored);
  } catch { /* ignore */ }

  const candidates = pool.filter((img) => !history.includes(img.id));
  let selected =
    candidates.length >= count
      ? candidates.slice(0, count)
      : [...candidates, ...pool.filter((img) => !candidates.includes(img))].slice(0, count);

  if (selected.length === 0) {
    return DEFAULT_IMAGES;
  }

  // Save history
  try {
    sessionStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(selected.map((s) => s.id)));
  } catch { /* ignore */ }

  return selected.map((img) => img.src);
};

/**
 * Get fallback gradients when network images can't load
 */
export const getFallbackGradients = (count = 4) =>
  FALLBACK_GRADIENTS.slice(0, count);
