<script lang="ts">
  import { IntlMessageFormat, type FormatXMLElementFn, type PrimitiveType } from 'intl-messageformat';
  import { TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
  import { locale as i18nLocale } from 'svelte-i18n';

  type InterpolationValues = Record<string, PrimitiveType | FormatXMLElementFn<unknown>>;

  export let message: unknown;
  export let values: InterpolationValues = {};

  const getLocale = (locale?: string | null) => {
    if (locale == null) {
      throw new Error('Cannot format a message without first setting the initial locale.');
    }

    return locale;
  };

  const getElements = (message: unknown, locale: string): MessageFormatElement[] => {
    return new IntlMessageFormat(message as string, locale, undefined, {
      ignoreTag: false,
    }).getAst();
  };

  const getParts = (message: unknown, locale: string) => {
    try {
      const elements = getElements(message, locale);

      return elements.map((element) => {
        const isTag = element.type === TYPE.tag;

        return {
          tag: isTag ? element.value : undefined,
          message: new IntlMessageFormat(isTag ? element.children : [element], locale, undefined, {
            ignoreTag: true,
          }).format(values) as string,
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Message "${message}" has syntax error:`, error.message);
      }
      return [{ message: message as string, tag: undefined }];
    }
  };

  $: locale = getLocale($i18nLocale);
  $: parts = getParts(message, locale);
</script>

{#each parts as { tag, message }}
  {#if tag}
    <slot {tag} {message}>{message}</slot>
  {:else}
    {message}
  {/if}
{/each}
