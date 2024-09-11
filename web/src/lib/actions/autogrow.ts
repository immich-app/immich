export const autoGrowHeight = (textarea: HTMLTextAreaElement, height = 'auto') => {
  if (!textarea) {
    return;
  }
  textarea.style.height = height;
  textarea.style.height = `${textarea.scrollHeight}px`;
};
