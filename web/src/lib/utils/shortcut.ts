export const shouldIgnoreShortcut = (event: Event): boolean => {
  const type = (event.target as HTMLInputElement).type;
  if (['textarea', 'text'].includes(type)) {
    return true;
  }
  return false;
};
