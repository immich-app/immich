<script lang="ts">
  import { globalSearchManager } from '$lib/managers/global-search-manager.svelte';
  import { Icon } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  const hotkeyLabel = isMac ? '⌘K' : 'Ctrl+K';
</script>

<button
  type="button"
  data-testid="cmdk-input-trigger"
  aria-label={$t('cmdk_placeholder')}
  onclick={() => globalSearchManager.open()}
  class="flex h-10 w-full items-center justify-between gap-4 rounded-2xl border border-gray-300/80 bg-gray-100/90 px-3 text-left text-sm shadow-sm transition-all duration-150 hover:border-primary/50 hover:bg-white hover:shadow md:h-11 dark:border-immich-dark-gray dark:bg-immich-dark-gray/70 dark:hover:border-primary/40 dark:hover:bg-immich-dark-gray"
>
  <span class="flex min-w-0 items-center gap-3 text-gray-500 dark:text-gray-300">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm dark:bg-immich-dark-bg dark:text-gray-300"
    >
      <Icon icon={mdiMagnify} size="1.05em" aria-hidden />
    </span>
    <span class="truncate">{$t('cmdk_placeholder')}</span>
  </span>
  <kbd
    class="hidden shrink-0 rounded-lg border border-gray-300 bg-white px-2 py-1 font-mono text-[11px] font-semibold tracking-wide text-gray-500 sm:inline-block dark:border-immich-dark-gray dark:bg-immich-dark-bg dark:text-gray-300"
    >{hotkeyLabel}</kbd
  >
</button>
