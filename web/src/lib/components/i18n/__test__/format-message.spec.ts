import FormatTagB from '$lib/components/i18n/__test__/format-tag-b.svelte';
import FormatMessage from '$lib/components/i18n/format-message.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { init, locale, register, waitLocale, type Translations } from 'svelte-i18n';
import { describe } from 'vitest';

describe('FormatMessage component', () => {
  beforeAll(async () => {
    register('en', () =>
      Promise.resolve({
        hello: 'Hello {name}',
        html: 'Hello <b>{name}</b>',
        plural: 'You have <b>{count, plural, one {# item} other {# items}}</b>',
        xss: '<image/src/onerror=prompt(8)>',
        plural_with_html: 'You have {count, plural, other {<b>#</b> items}}',
        select_with_html: 'Item is {status, select, other {<b>disabled</b>}}',
        ordinal_with_html: '{count, selectordinal, other {<b>#th</b>}} item',
      }),
    );

    await init({ fallbackLocale: 'en' });
    await waitLocale('en');
  });

  it('formats a plain text message', () => {
    render(FormatMessage, {
      key: 'hello' as Translations,
      values: { name: 'test' },
    });
    expect(screen.getByText('Hello test')).toBeInTheDocument();
  });

  it('throws an error when locale is empty', async () => {
    await locale.set(undefined);
    expect(() => render(FormatMessage, { key: '' as Translations })).toThrowError();
    await locale.set('en');
  });

  it('shows raw message when value is empty', () => {
    render(FormatMessage, {
      key: 'hello' as Translations,
    });
    expect(screen.getByText('Hello {name}')).toBeInTheDocument();
  });

  it('shows message when slot is empty', () => {
    render(FormatMessage, {
      key: 'html' as Translations,
      values: { name: 'test' },
    });
    expect(screen.getByText('Hello test')).toBeInTheDocument();
  });

  it('renders a message with html', () => {
    const { container } = render(FormatTagB, {
      key: 'html' as Translations,
      values: { name: 'test' },
    });
    expect(container.innerHTML).toBe('Hello <strong>test</strong>');
  });

  it('renders a message with html and plural', () => {
    const { container } = render(FormatTagB, {
      key: 'plural' as Translations,
      values: { count: 1 },
    });
    expect(container.innerHTML).toBe('You have <strong>1 item</strong>');
  });

  it('protects agains XSS injection', () => {
    render(FormatMessage, {
      key: 'xss' as Translations,
    });
    expect(screen.getByText('<image/src/onerror=prompt(8)>')).toBeInTheDocument();
  });

  it('displays the message key when not found', () => {
    render(FormatMessage, { key: 'invalid.key' as Translations });
    expect(screen.getByText('invalid.key')).toBeInTheDocument();
  });

  it('supports html tags inside plurals', () => {
    const { container } = render(FormatTagB, {
      key: 'plural_with_html' as Translations,
      values: { count: 10 },
    });
    expect(container.innerHTML).toBe('You have <strong>10</strong> items');
  });

  it('supports html tags inside select', () => {
    const { container } = render(FormatTagB, {
      key: 'select_with_html' as Translations,
      values: { status: true },
    });
    expect(container.innerHTML).toBe('Item is <strong>disabled</strong>');
  });

  it('supports html tags inside selectordinal', () => {
    const { container } = render(FormatTagB, {
      key: 'ordinal_with_html' as Translations,
      values: { count: 4 },
    });
    expect(container.innerHTML).toBe('<strong>4th</strong> item');
  });
});
