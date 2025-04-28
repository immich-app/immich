class DragAndDropManager {
  #isDragging = $state<boolean>(false);
  #files = $state<File[]>([]);

  get isDragging() {
    return this.#isDragging;
  }

  get files() {
    return this.#files;
  }

  set isDragging(isDragging: boolean) {
    this.#isDragging = isDragging;
  }

  set files(files: File[]) {
    this.#files = files;
  }

  reset() {
    this.#isDragging = false;
    this.#files = [];
  }
}

export const dragAndDropManager = new DragAndDropManager();
