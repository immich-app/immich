export const autoGrowHeight = (textarea: HTMLTextAreaElement, height = 'auto') => {
  const resize = () => {
    textarea.style.height = height;
    textarea.style.height = `${textarea.scrollHeight + 5}px`;
  };

  resize();

  textarea.addEventListener('input', resize);
  window.addEventListener('resize', resize);

  return {
    destroy: () => {
      textarea.removeEventListener('input', resize);
      window.removeEventListener('resize', resize);
    },
  };
};
