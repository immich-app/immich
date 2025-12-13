import { tick } from 'svelte';
import { vi } from 'vitest';

export const getAnimateMock = () =>
  vi.fn().mockImplementation(() => {
    let onfinish: (() => void) | null = null;
    void tick().then(() => onfinish?.());

    return {
      set onfinish(fn: () => void) {
        onfinish = fn;
      },
      cancel() {
        onfinish = null;
      },
    };
  });
