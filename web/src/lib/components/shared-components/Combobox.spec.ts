import Combobox from '#lib/components/shared-components/Combobox.svelte';
import { render } from 'vitest-browser-svelte';

describe('Combobox', () => {
  describe('Component rendering', () => {
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
