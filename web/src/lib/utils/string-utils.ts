export const removeAccents = (str: string) => {
  return str.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '');
};

export const normalizeSearchString = (str: string) => {
  return removeAccents(str.toLocaleLowerCase());
};

export const buildDateString = (year: number, month?: number, day?: number) => {
  return [
    year.toString(),
    month && !Number.isNaN(month) ? month.toString() : undefined,
    day && !Number.isNaN(day) ? day.toString() : undefined,
  ]
    .filter((date) => date !== undefined)
    .join('-');
};
