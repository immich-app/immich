<script lang="ts">
  import { Field, Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    contentFilter: string | undefined;
    contentFilterThreshold: number | undefined;
  }

  let { contentFilter = $bindable(), contentFilterThreshold = $bindable() }: Props = $props();

  const DEFAULT_THRESHOLD = 0.78;

  // When content filter text is entered, ensure threshold has a default
  $effect(() => {
    if (contentFilter && contentFilterThreshold === undefined) {
      contentFilterThreshold = DEFAULT_THRESHOLD;
    }
  });

  // CLIP cannot handle negation — embeddings for "a dog" and "no dog" are nearly
  // identical (Alhamoud et al., CVPR 2025: "VLMs Do Not Understand Negation")
  const hasNegation = $derived(contentFilter?.match(/\b(not|no|without|except|excluding)\b/i));

  const thresholdLabel = $derived(
    contentFilterThreshold !== undefined
      ? contentFilterThreshold <= 0.6
        ? $t('content_filter_strict')
        : contentFilterThreshold >= 0.9
          ? $t('content_filter_loose')
          : $t('content_filter_moderate')
      : '',
  );
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

  {#if contentFilter}
    <div class="mt-3">
      <div class="flex items-center justify-between mb-1">
        <Text class="text-xs text-gray-600 dark:text-gray-300">{$t('content_filter_threshold')}</Text>
        <Text class="text-xs text-gray-500 dark:text-gray-400">
          {(contentFilterThreshold ?? DEFAULT_THRESHOLD).toFixed(2)} — {thresholdLabel}
        </Text>
      </div>
      <input
        type="range"
        min="0.5"
        max="1.0"
        step="0.01"
        value={contentFilterThreshold ?? DEFAULT_THRESHOLD}
        oninput={(e) => {
          contentFilterThreshold = Number(e.currentTarget.value);
        }}
        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-immich-primary dark:accent-immich-dark-primary"
      />
      <div class="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        <span>{$t('content_filter_strict')}</span>
        <span>{$t('content_filter_loose')}</span>
      </div>
    </div>
  {/if}
</div>
