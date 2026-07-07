export const removeAccents = (str: string) => {
  return str.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '');
};

export const normalizeSearchString = (str: string) => {
  return removeAccents(str.toLocaleLowerCase());
};

export const nullToEmpty = (value: string | null | undefined): string => value ?? '';

export const nullToUndefined = (value: string | null | undefined): string | undefined => value ?? undefined;

export const getUserDisplayName = (user: { name: string | null; email: string }): string => user.name ?? user.email;

export const getPersonDisplayName = (name: string | null): string => name ?? '';
