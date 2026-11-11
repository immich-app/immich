import Combobox from '#lib/components/shared-components/Combobox.svelte';
import { asComboboxOptions, asSelectedOption } from '#lib/components/shared-components/combobox-utils.ts';
import { render } from 'vitest-browser-svelte';

describe('Combobox', () => {
  describe('asComboboxOptions', () => {
    it('maps empty strings and non-empty values with unique ids', () => {
      const options = asComboboxOptions(['', 'Unknown', 'Canon']);

      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({ id: '', label: 'unknown', value: '' });
      expect(options[1]).toEqual({ id: 'Unknown', label: 'Unknown', value: 'Unknown' });
      expect(options[2]).toEqual({ id: 'Canon', label: 'Canon', value: 'Canon' });
      expect(options[0].id).not.toBe(options[1].id);
    });
  });

  describe('asSelectedOption', () => {
    it('returns undefined for undefined input', () => {
      expect(asSelectedOption(undefined)).toBeUndefined();
    });

    it('returns the matched option for a defined input', () => {
      expect(asSelectedOption('Canon')).toEqual({ id: 'Canon', label: 'Canon', value: 'Canon' });
    });
  });

  describe('Component rendering', () => {
    it('renders options when both empty and "Unknown" values are present without duplicate keys', async () => {
      const options = asComboboxOptions(['', 'Unknown']);
      const { baseElement } = await render(Combobox, {
        label: 'Make',
        options,
      });
      expect(baseElement).not.toBeNull();
    });

    it('renders options without explicit ids when labels collide', async () => {
      const options = [
        { label: 'Unknown', value: '' },
        { label: 'Unknown', value: 'Unknown' },
      ];
      const { baseElement } = await render(Combobox, {
        label: 'Make',
        options,
      });
      expect(baseElement).not.toBeNull();
    });
  });
});
