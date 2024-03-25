export const removeAccents = (str: string) => {
  return str.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '');
};

export const normalizeSearchString = (str: string) => {
  return removeAccents(str.toLocaleLowerCase());
};
