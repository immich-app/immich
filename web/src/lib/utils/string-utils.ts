export const removeAccents = (str: string) => {
  return str.normalize('NFD').replaceAll(/[\u{300}-\u{36F}]/gu, '');
};

export const normalizeSearchString = (str: string) => {
  return removeAccents(str.toLocaleLowerCase());
};
