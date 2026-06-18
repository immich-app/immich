class KeyboardManager {
  #shift = $state(false);
  #ctrl = $state(false);
  #meta = $state(false);
  #alt = $state(false);

  constructor() {
    if (globalThis.window === undefined) {
      return;
    }
    globalThis.addEventListener('keydown', this.#update);
    globalThis.addEventListener('keyup', this.#update);
    globalThis.addEventListener('blur', this.#clear);
  }

  get shift() {
    return this.#shift;
  }

  get ctrl() {
    return this.#ctrl;
  }

  get meta() {
    return this.#meta;
  }

  get alt() {
    return this.#alt;
  }

  #update = (event: KeyboardEvent) => {
    this.#shift = event.shiftKey;
    this.#ctrl = event.ctrlKey;
    this.#meta = event.metaKey;
    this.#alt = event.altKey;
  };

  #clear = () => {
    this.#shift = false;
    this.#ctrl = false;
    this.#meta = false;
    this.#alt = false;
  };
}

export const keyboardManager = new KeyboardManager();
