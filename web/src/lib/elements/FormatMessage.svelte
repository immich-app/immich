<script lang="ts">
  import type { InterpolationValues } from '$lib/elements/format-message';
  import {
    TYPE,
    type MessageFormatElement,
    type PluralElement,
    type SelectElement,
  } from '@formatjs/icu-messageformat-parser';
  import { IntlMessageFormat, type FormatXMLElementFn } from 'intl-messageformat';
  import { locale as i18nLocale, json, type Translations } from 'svelte-i18n';

  type MessagePart = {
    message: string;
    tag?: string;
  };

  interface Props {
    key: Translations;
    values?: InterpolationValues;
    children?: import('svelte').Snippet<[{ tag?: string; message?: string }]>;
  }

  let { key, values = {}, children }: Props = $props();

  const getLocale = (locale?: string | null) => {
    if (locale == null) {
      throw new Error('Cannot format a message without first setting the initial locale.');
    }

    return locale;
  };

  const getElements = (message: string | MessageFormatElement[], locale: string): MessageFormatElement[] => {
    return new IntlMessageFormat(message, locale, undefined, {
      ignoreTag: false,
    }).getAst();
  };

  const getTagReplacements = (element: PluralElement | SelectElement) => {
    const replacements: Record<string, FormatXMLElementFn<unknown>> = {};

    for (const option of Object.values(element.options)) {
      for (const pluralElement of option.value) {
        if (pluralElement.type === TYPE.tag) {
          const tag = pluralElement.value;
          replacements[tag] = (...parts) => `<${tag}>${parts}</${tag}>`;
        }
      }
    }

    return replacements;
  };

  const formatElementToParts = (element: MessageFormatElement, values: InterpolationValues) => {
    const message = new IntlMessageFormat([element], locale, undefined, {
      ignoreTag: true,
    }).format(values) as string;

    const pluralElements = new IntlMessageFormat(message, locale, undefined, {
      ignoreTag: false,
    }).getAst();

    return pluralElements.map((element) => elementToPart(element));
  };

  const elementToPart = (element: MessageFormatElement): MessagePart => {
    const isTag = element.type === TYPE.tag;

    return {
      tag: isTag ? element.value : undefined,
      message: new IntlMessageFormat(isTag ? element.children : [element], locale, undefined, {
        ignoreTag: true,
      }).format(values) as string,
    };
  };

  const getParts = (message: string, locale: string) => {
    try {
      const elements = getElements(message, locale);
      const parts: MessagePart[] = [];

      for (const element of elements) {
        if (element.type === TYPE.plural || element.type === TYPE.select) {
          const replacements = getTagReplacements(element);
          parts.push(...formatElementToParts(element, { ...values, ...replacements }));
        } else {
          parts.push(elementToPart(element));
        }
      }

      return parts;
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Message "${key}" has syntax error:`, error.message);
      }
      return [{ message, tag: undefined }];
    }
  };

  let message = $derived(($json(key) as string) || key);
  let locale = $derived(getLocale($i18nLocale));
  let parts = $derived(getParts(message, locale));
</script>

<!--
@component
Formats an [ICU message](https://formatjs.io/docs/core-concepts/icu-syntax) that contains HTML tags

### Props
- `key` - Key of a defined message
- `values` - Object with a value for each placeholder in the message (optional)

### Default Slot
Used for every occurrence of an HTML tag in a message
- `tag` - Name of the tag
- `message` - Formatted text inside the tag

@example
```svelte
{"message": "Visit <link>docs</link> <b>{time}</b>"}
<FormattedMessage key="message" values={{ time: 'now' }} let:tag let:message>
  {#if tag === 'link'}
    <a href="">{message}</a>
  {:else if tag === 'b'}
    <strong>{message}</strong>
  {/if}
</FormattedMessage>

Result: Visit <a href="">docs</a> <strong>now</strong>
```
-->
<!-- eslint-disable-next-line svelte/require-each-key -->
{#each parts as { tag, message }}
  {#if tag}
    {#if children}{@render children({ tag, message })}{:else}{message}{/if}
  {:else}
    {message}
  {/if}
{/each}
