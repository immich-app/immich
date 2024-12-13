import { tick } from 'svelte';
import type { Action } from 'svelte/action';

type Parameters = {
  height?: string;
  value: string; // added to enable reactivity
};

export const autoGrowHeight: Action<HTMLTextAreaElement, Parameters> = (textarea, { height = 'auto' }) => {
  const update = () => {
    void tick().then(() => {
      textarea.style.height = height;
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  };

  update();
  return { update };
};
