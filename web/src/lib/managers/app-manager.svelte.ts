class AppManager {
  #isAssetViewer = $state<boolean>(false);

  set isAssetViewer(value: boolean) {
    this.#isAssetViewer = value;
  }

  get isAssetViewer() {
    return this.#isAssetViewer;
  }
}

export const appManager = new AppManager();
