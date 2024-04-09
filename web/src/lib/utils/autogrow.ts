export const autoGrowHeight = (textarea: HTMLTextAreaElement, height = 'auto') => {
  textarea.style.height = height;
  textarea.style.height = `${textarea.scrollHeight}px`;
};
