<script lang="ts">
  import { Field, Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    contentFilter: string | undefined;
  }

  let { contentFilter = $bindable() }: Props = $props();

  // CLIP cannot handle negation — embeddings for "a dog" and "no dog" are nearly
  // identical (Alhamoud et al., CVPR 2025: "VLMs Do Not Understand Negation")
  const hasNegation = $derived(contentFilter?.match(/\b(not|no|without|except|excluding)\b/i));
</script>

<div class="flex flex-col">
  <Text class="mb-2" fontWeight="medium">{$t('content_type')}</Text>

  <Field label={$t('content_type')}>
    <Input type="text" placeholder={$t('content_filter_placeholder')} bind:value={contentFilter} />
  </Field>

  {#if hasNegation}
    <Text class="mt-1 text-xs text-orange-600 dark:text-orange-400">
      {$t('content_filter_negation_warning')}
    </Text>
  {:else}
    <Text class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {$t('content_filter_description')}
    </Text>
  {/if}
</div>
