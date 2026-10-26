import type { LatLng } from '#lib/types.js';

class GeolocationManager {
  #lastPoint = $state<LatLng>();

  get lastPoint() {
    return this.#lastPoint;
  }

  onSelected(point: LatLng) {
    this.#lastPoint = point;
  }
}

export const geolocationManager = new GeolocationManager();
