import { vi } from 'vitest';

export const getIntersectionObserverMock = () =>
  vi.fn(function () {
    return {
      disconnect: vi.fn(),
      observe: vi.fn(),
      takeRecords: vi.fn(),
      unobserve: vi.fn(),
    };
  });
