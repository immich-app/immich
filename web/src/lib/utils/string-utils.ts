export const removeAccents = (str: string) => {
  return str.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '');
};

export const normalizeSearchString = (str: string) => {
  return removeAccents(str.toLocaleLowerCase());
};

export const encodeHTMLSpecialChars = (str: string) => {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};
