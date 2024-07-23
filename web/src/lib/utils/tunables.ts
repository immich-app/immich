function getBoolean(string: string | null, fallback: boolean) {
  if (string === null) {
    return fallback;
  }
  return 'true' === string;
}
function getNumber(string: string | null, fallback: number) {
  if (string === null) {
    return fallback;
  }
  return Number.parseInt(string);
}
function getFloat(string: string | null, fallback: number) {
  if (string === null) {
    return fallback;
  }
  return Number.parseFloat(string);
}
export const TUNABLES = {
  SCROLL_TASK_QUEUE: {
    TRICKLE_BONUS_FACTOR: getNumber(localStorage.getItem('SCROLL_TASK_QUEUE.TRICKLE_BONUS_FACTOR'), 25),
    TRICKLE_ACCELERATION_FACTOR: getFloat(localStorage.getItem('SCROLL_TASK_QUEUE.TRICKLE_ACCELERATION_FACTOR'), 1.5),
    TRICKLE_ACCELERATED_MIN_DELAY: getNumber(
      localStorage.getItem('SCROLL_TASK_QUEUE.TRICKLE_ACCELERATED_MIN_DELAY'),
      8,
    ),
    TRICKLE_ACCELERATED_MAX_DELAY: getNumber(
      localStorage.getItem('SCROLL_TASK_QUEUE.TRICKLE_ACCELERATED_MAX_DELAY'),
      2000,
    ),
    DRAIN_MAX_TASKS: getNumber(localStorage.getItem('SCROLL_TASK_QUEUE.DRAIN_MAX_TASKS'), 15),
    DRAIN_MAX_TASKS_DELAY_MS: getNumber(localStorage.getItem('SCROLL_TASK_QUEUE.DRAIN_MAX_TASKS_DELAY_MS'), 16),
    MIN_DELAY_MS: getNumber(localStorage.getItem('SCROLL_TASK_QUEUE.MIN_DELAY_MS')!, 200),
    CHECK_INTERVAL_MS: getNumber(localStorage.getItem('SCROLL_TASK_QUEUE.CHECK_INTERVAL_MS'), 16),
  },
  INTERSECTION_OBSERVER_QUEUE: {
    DRAIN_MAX_TASKS: getNumber(localStorage.getItem('INTERSECTION_OBSERVER_QUEUE.DRAIN_MAX_TASKS'), 15),
    THROTTLE_MS: getNumber(localStorage.getItem('INTERSECTION_OBSERVER_QUEUE.THROTTLE_MS'), 16),
    THROTTLE: getBoolean(localStorage.getItem('INTERSECTION_OBSERVER_QUEUE.THROTTLE'), true),
  },
  ASSET_GRID: {
    NAVIGATE_ON_ASSET_IN_VIEW: getBoolean(localStorage.getItem('ASSET_GRID.NAVIGATE_ON_ASSET_IN_VIEW'), false),
  },
  BUCKET: {
    PRIORITY: getNumber(localStorage.getItem('BUCKET.PRIORITY'), 2),
    INTERSECTION_ROOT_TOP: localStorage.getItem('BUCKET.INTERSECTION_ROOT_TOP') || '300%',
    INTERSECTION_ROOT_BOTTOM: localStorage.getItem('BUCKET.INTERSECTION_ROOT_BOTTOM') || '300%',
  },
  DATEGROUP: {
    PRIORITY: getNumber(localStorage.getItem('DATEGROUP.PRIORITY'), 4),
    INTERSECTION_DISABLED: getBoolean(localStorage.getItem('DATEGROUP.INTERSECTION_DISABLED'), false),
    INTERSECTION_ROOT_TOP: localStorage.getItem('DATEGROUP.INTERSECTION_ROOT_TOP') || '150%',
    INTERSECTION_ROOT_BOTTOM: localStorage.getItem('DATEGROUP.INTERSECTION_ROOT_BOTTOM') || '150%',
  },
  THUMBNAIL: {
    PRIORITY: getNumber(localStorage.getItem('THUMBNAIL.PRIORITY'), 8),
    INTERSECTION_ROOT_TOP: localStorage.getItem('THUMBNAIL.INTERSECTION_ROOT_TOP') || '250%',
    INTERSECTION_ROOT_BOTTOM: localStorage.getItem('THUMBNAIL.INTERSECTION_ROOT_BOTTOM') || '250%',
  },
  IMAGE_THUMBNAIL: {
    THUMBHASH_FADE_DURATION: getNumber(localStorage.getItem('THUMBHASH_FADE_DURATION'), 150),
  },
};
