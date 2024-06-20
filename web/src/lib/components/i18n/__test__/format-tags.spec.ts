import FormatTagB from '$lib/components/i18n/__test__/format-tag-b.svelte';
import FormatTags from '$lib/components/i18n/format-tags.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { init, json, locale, register, waitLocale } from 'svelte-i18n';
import { get } from 'svelte/store';
import { describe } from 'vitest';

describe('FormatTags component', () => {
  let $json: (id: string, locale?: string | undefined) => unknown;

  beforeAll(async () => {
    register('en', () =>
      Promise.resolve({
        hello: 'Hello {name}',
        html: 'Hello <b>{name}</b>',
        plural: 'You have <b>{count, plural, one {# item} other {# items}}</b>',
        xss: '<image/src/onerror=prompt(8)>',
      }),
    );

    await init({ fallbackLocale: 'en' });
    await waitLocale('en');
    $json = get(json);
  });

  it('formats a plain text message', () => {
    render(FormatTags, {
      message: $json('hello'),
      values: { name: 'test' },
    });
    expect(screen.getByText('Hello test')).toBeInTheDocument();
  });

  it('throws an error when locale is empty', async () => {
    await locale.set(undefined);
    expect(() => render(FormatTags, { message: undefined })).toThrowError();
    await locale.set('en');
  });

  it('shows raw message when value is empty', () => {
    render(FormatTags, {
      message: $json('hello'),
    });
    expect(screen.getByText('Hello {name}')).toBeInTheDocument();
  });

  it('shows message when slot is empty', () => {
    render(FormatTags, {
      message: $json('html'),
      values: { name: 'test' },
    });
    expect(screen.getByText('Hello test')).toBeInTheDocument();
  });

  it('renders a message with html', () => {
    const { container } = render(FormatTagB, {
      message: $json('html'),
      values: { name: 'test' },
    });
    expect(container.innerHTML).toBe('Hello <strong>test</strong>');
  });

  it('renders a message with html and plural', () => {
    const { container } = render(FormatTagB, {
      message: $json('plural'),
      values: { count: 1 },
    });
    expect(container.innerHTML).toBe('You have <strong>1 item</strong>');
  });

  it('protects agains XSS injection', () => {
    render(FormatTags, {
      message: $json('xss'),
    });
    expect(screen.getByText('<image/src/onerror=prompt(8)>')).toBeInTheDocument();
  });
});
