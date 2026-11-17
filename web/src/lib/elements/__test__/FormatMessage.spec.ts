import FormatMessage from '#lib/elements/FormatMessage.svelte';
import FormatTagB from '#lib/elements/__test__/FormatTagB.svelte';
import { init, locale, register, waitLocale, type Translations } from 'svelte-i18n';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';

const getSanitizedHTML = (container: HTMLElement) => container.getHTML().replaceAll('<!---->', '');

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

  it('formats a plain text message', async () => {
    const screen = await render(FormatMessage, {
      key: 'hello' as Translations,
      values: { name: 'test' },
    });
    await expect.element(screen.getByText('Hello test')).toBeInTheDocument();
  });

  it('throws an error when locale is empty', async () => {
    await locale.set(undefined);
    await expect(render(FormatMessage, { key: '' as Translations })).rejects.toThrow();
    await locale.set('en');
  });

  it('shows raw message when value is empty', async () => {
    const screen = await render(FormatMessage, {
      key: 'hello' as Translations,
    });
    await expect.element(screen.getByText('Hello {name}')).toBeInTheDocument();
  });

  it('shows message when slot is empty', async () => {
    const screen = await render(FormatMessage, {
      key: 'html' as Translations,
      values: { name: 'test' },
    });
    await expect.element(screen.getByText('Hello test')).toBeInTheDocument();
  });

  it('renders a message with html', async () => {
    const { container } = await render(FormatTagB, {
      key: 'html' as Translations,
      values: { name: 'test' },
    });
    expect(getSanitizedHTML(container)).toBe('Hello <strong>test</strong>');
  });

  it('renders a message with html and plural', async () => {
    const { container } = await render(FormatTagB, {
      key: 'plural' as Translations,
      values: { count: 1 },
    });
    expect(getSanitizedHTML(container)).toBe('You have <strong>1 item</strong>');
  });

  it('protects against XSS injection', async () => {
    const screen = await render(FormatMessage, {
      key: 'xss' as Translations,
    });
    await expect.element(screen.getByText('<image/src/onerror=prompt(8)>')).toBeInTheDocument();
  });

  it('displays the message key when not found', async () => {
    const screen = await render(FormatMessage, { key: 'invalid.key' as Translations });
    await expect.element(screen.getByText('invalid.key')).toBeInTheDocument();
  });

  it('supports html tags inside plurals', async () => {
    const { container } = await render(FormatTagB, {
      key: 'plural_with_html' as Translations,
      values: { count: 10 },
    });
    expect(getSanitizedHTML(container)).toBe('You have <strong>10</strong> items');
  });

  it('supports html tags inside select', async () => {
    const { container } = await render(FormatTagB, {
      key: 'select_with_html' as Translations,
      values: { status: true },
    });
    expect(getSanitizedHTML(container)).toBe('Item is <strong>disabled</strong>');
  });

  it('supports html tags inside selectordinal', async () => {
    const { container } = await render(FormatTagB, {
      key: 'ordinal_with_html' as Translations,
      values: { count: 4 },
    });
    expect(getSanitizedHTML(container)).toBe('<strong>4th</strong> item');
  });
});
