import { RegisterItem } from 'src/sql-tools/from-code/register-item';

const items: RegisterItem[] = [];

export const register = (item: RegisterItem) => void items.push(item);

export const getRegisteredItems = () => items;

export const resetRegisteredItems = () => {
  items.length = 0;
};
