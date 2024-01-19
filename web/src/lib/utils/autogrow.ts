export const autoGrowHeight = (textarea: HTMLTextAreaElement, height = 'auto') => {
  // little hack so that the height of the text area is correctly initialized
  textarea.scrollHeight;
  textarea.style.height = height;
  textarea.style.height = `${textarea.scrollHeight}px`;
};
