class ContextMenuManager {
  #selectedId = $state<string | undefined>(undefined);
  #optionClickCallback = $state<(() => void) | undefined>(undefined);

  get selectedId() {
    return this.#selectedId;
  }

  set selectedId(id: string | undefined) {
    this.#selectedId = id;
  }

  get optionClickCallback() {
    return this.#optionClickCallback;
  }

  set optionClickCallback(callback: (() => void) | undefined) {
    this.#optionClickCallback = callback;
  }
}

export const contextMenuManager = new ContextMenuManager();
