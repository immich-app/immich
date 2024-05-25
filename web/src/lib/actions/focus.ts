export const initInput = (element: HTMLInputElement, timeOut: number = 0) => {
  setTimeout(() => element.focus(), timeOut);
};
