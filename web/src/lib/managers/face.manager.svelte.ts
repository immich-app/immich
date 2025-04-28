class FaceManager {
  #isEditMode = $state(false);

  get isEditMode() {
    return this.#isEditMode;
  }

  set isEditMode(isEditMode: boolean) {
    this.#isEditMode = isEditMode;
  }
}

export const faceManager = new FaceManager();
