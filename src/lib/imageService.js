import { HERO_IMAGE_LIBRARY, DEFAULT_IMAGES } from '../constants/heroImages';

const STORAGE_KEY_HISTORY = 'vegaa_hero_history';
const STORAGE_KEY_STATS = 'vegaa_hero_stats';

/**
 * Determine current time of day context
 * @returns {string} 'morning', 'afternoon', or 'evening'
 */
const getTimeContext = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

/**
 * Get a curated list of images for the current session
 * @param {number} count Number of images to return
 * @returns {Array} Array of image URLs
 */
export const getDynamicHeroImages = (count = 4) => {
  const timeContext = getTimeContext();
  
  // Filter by time context, but allow fallback to others if not enough
  let relevantImages = HERO_IMAGE_LIBRARY.filter(img => img.timeOfDay.includes(timeContext));
  const otherImages = HERO_IMAGE_LIBRARY.filter(img => !img.timeOfDay.includes(timeContext));
  
  // Shuffle both lists
  relevantImages = shuffle(relevantImages);
  const shuffledOthers = shuffle(otherImages);

  // Combine, prioritizing relevant ones
  const pool = [...relevantImages, ...shuffledOthers];

  // Retrieve history to avoid immediate repeats if possible
  let history = [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_HISTORY);
    if (stored) history = JSON.parse(stored);
  } catch (e) {
    console.warn('Failed to read image history', e);
  }

  // Filter out recently shown images if we have enough alternatives
  const candidates = pool.filter(img => !history.includes(img.id));
  
  // Select final list
  let selected = [];
  if (candidates.length >= count) {
    selected = candidates.slice(0, count);
  } else {
    // Fill with pool if candidates aren't enough (looping back)
    selected = [...candidates, ...pool.filter(img => !candidates.includes(img))].slice(0, count);
  }

  // If something went wrong and we have 0, use defaults
  if (selected.length === 0) {
    return DEFAULT_IMAGES;
  }

  // Update history
  const newHistory = selected.map(img => img.id);
  try {
    sessionStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
  } catch (e) {
    // ignore
  }

  // Track impressions (mock analytics)
  trackImpressions(selected);

  return selected.map(img => img.src);
};

const trackImpressions = (images) => {
  try {
    let stats = {};
    const stored = localStorage.getItem(STORAGE_KEY_STATS);
    if (stored) stats = JSON.parse(stored);

    images.forEach(img => {
      stats[img.id] = (stats[img.id] || 0) + 1;
    });

    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    // In a real app, you'd send this to an analytics endpoint
    console.log('Image impressions tracked:', images.map(i => i.id));
  } catch (e) {
    console.warn('Failed to track stats', e);
  }
};
