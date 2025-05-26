class AlbumMapViewManager {
  #isInMapView = $state(false);

  get isInMapView() {
    return this.#isInMapView;
  }

  set isInMapView(isInMapView: boolean) {
    this.#isInMapView = isInMapView;
  }
}

export const albumMapViewManager = new AlbumMapViewManager();
