import '@testing-library/jest-dom';
import { init } from 'svelte-i18n';

// Node.js 25+ exposes a native globalThis.localStorage that lacks Web Storage API methods
// (getItem, setItem, etc.), breaking svelte-persisted-store. Provide a proper implementation.
function createStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

if (typeof globalThis.localStorage?.getItem !== 'function') {
  const ls = createStorage();
  const ss = createStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: ss, writable: true, configurable: true });
  if (globalThis.window !== undefined) {
    Object.defineProperty(globalThis.window, 'localStorage', { value: ls, writable: true, configurable: true });
    Object.defineProperty(globalThis.window, 'sessionStorage', { value: ss, writable: true, configurable: true });
  }
}

beforeAll(async () => {
  await init({ fallbackLocale: 'dev' });
  Element.prototype.animate = vi.fn().mockImplementation(function () {
    return { cancel: () => {}, finished: Promise.resolve() };
  });
});

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});

vi.mock('$env/dynamic/public', () => {
  return {
    env: {
      PUBLIC_IMMICH_HOSTNAME: '',
    },
  };
});
