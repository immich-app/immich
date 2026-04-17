import { vi } from 'vitest';

export const getResizeObserverMock = () =>
  vi.fn(function () {
    return {
      disconnect: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
    };
  });
