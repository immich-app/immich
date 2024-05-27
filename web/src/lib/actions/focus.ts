export const initInput = (element: HTMLInputElement, timeout: number = 0) => {
  setTimeout(() => element.focus(), timeout);
};
