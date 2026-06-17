class KeyboardModifierStore {
  shift = $state(false);
  ctrl = $state(false);
  meta = $state(false);
  alt = $state(false);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('keydown', this.update);
    window.addEventListener('keyup', this.update);
    window.addEventListener('blur', this.clear);
  }

  private update = (event: KeyboardEvent) => {
    this.shift = event.shiftKey;
    this.ctrl = event.ctrlKey;
    this.meta = event.metaKey;
    this.alt = event.altKey;
  };

  private clear = () => {
    this.shift = false;
    this.ctrl = false;
    this.meta = false;
    this.alt = false;
  };
}

export const keyboardModifier = new KeyboardModifierStore();
