import type { Action } from 'svelte/action';

type Parameters = {
  height?: string;
  value: string; // added to enable reactivity
};

export const autoGrowHeight: Action<HTMLTextAreaElement, Parameters> = (textarea) => {
  const resize = () => {
    textarea.style.minHeight = '0';
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  resize();
  textarea.addEventListener('input', resize);
  return {
    update: resize,
    destroy() {
      textarea.removeEventListener('input', resize);
    },
  };
};
