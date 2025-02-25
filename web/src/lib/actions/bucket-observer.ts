

const buckets = new Set<HTMLElement>();

/**
 * Monitors an element's visibility in the viewport and calls functions when it enters or leaves (based on a threshold).
 * @param element
 * @param properties One or multiple configurations for the IntersectionObserver(s)
 * @returns
 */
export function bucketObserver(
  element: HTMLElement,
) {

  buckets.add(element);
  return {
    destroy: () => {
      buckets.delete(element)
    },
  }
}
