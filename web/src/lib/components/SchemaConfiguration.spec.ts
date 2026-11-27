import SchemaConfiguration from '#lib/components/SchemaConfiguration.svelte';
import type { JSONSchemaProperty } from '#lib/types.ts';
import { render } from 'vitest-browser-svelte';

const numberInput = async (schema: JSONSchemaProperty) => {
  const { baseElement } = await render(SchemaConfiguration, {
    schema: { type: 'object', properties: { value: schema } },
    config: {},
    root: true,
  });
  return baseElement.querySelector<HTMLInputElement>('input[type="number"]')!;
};

describe('SchemaConfiguration', () => {
  it('accepts decimals in a number field without a precision', async () => {
    const input = await numberInput({ type: 'number', title: 'Maximum distance', minimum: 0 });

    input.value = '1.5';

    expect(input.validity.valid).toBe(true);
  });
});
