import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

export type ComboBoxOption = {
  id?: string;
  label: string;
  value: string;
};

export const asComboboxOptions = (values: string[]): ComboBoxOption[] =>
  values.map((value) => {
    if (value === '') {
      return { id: value, label: get(t)('unknown'), value: '' };
    }

    return { id: value, label: value, value };
  });

export const asSelectedOption = (value?: string) => (value === undefined ? undefined : asComboboxOptions([value])[0]);
