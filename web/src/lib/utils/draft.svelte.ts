export class Draft<T> {
  #source: () => T;
  #draft = $state<{ value: T }>();

  constructor(source: () => T) {
    this.#source = source;
  }

  get value() {
    return this.#draft ? this.#draft.value : this.#source();
  }

  set value(value: T) {
    this.#draft = { value };
  }

  reset() {
    this.#draft = undefined;
  }
}
