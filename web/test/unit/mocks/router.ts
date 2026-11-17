const origin = 'http://localhost';

export class MockRouter {
  static #active?: MockRouter;

  static get instance() {
    if (!MockRouter.#active) {
      throw new Error('No mock router is set up');
    }
    return MockRouter.#active;
  }

  url = new URL('/', origin);
  params: Record<string, string> = {};
  readonly history: URL[] = [];

  setup() {
    MockRouter.#active = this;
  }

  teardown() {
    MockRouter.#active = undefined;
  }

  goto(target: string | URL, params: Record<string, string> = {}) {
    this.url = new URL(String(target), this.url);
    this.params = params;
    this.history.push(this.url);
    return Promise.resolve();
  }
}
