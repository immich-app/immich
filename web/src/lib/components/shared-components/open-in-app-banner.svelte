<script lang="ts">
  import { browser } from '$app/environment';
  import { mdiClose } from '@mdi/js';
  import { Button, Icon, Logo } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    shareKey: string;
    serverUrl: string;
  };

  const { shareKey, serverUrl }: Props = $props();

  const STORAGE_KEY = 'immich-open-in-app-dismissed';
  const isMobile = $derived(
    browser && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  );

  let isDismissed = $state(browser && localStorage.getItem(STORAGE_KEY) === 'true');
  let showBanner = $derived(isMobile && !isDismissed);

  const deepLinkUrl = $derived(
    `https://my.immich.app/share/${shareKey}?server=${encodeURIComponent(serverUrl)}`,
  );

  function dismiss() {
    isDismissed = true;
    if (browser) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }
</script>

{#if showBanner}
  <div
    class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-immich-bg dark:bg-immich-dark-gray p-3 shadow-lg border-t border-gray-200 dark:border-gray-700"
  >
    <div class="flex items-center gap-3 min-w-0">
      <div class="shrink-0 w-10 h-10">
        <Logo variant="icon" />
      </div>
      <div class="min-w-0">
        <p class="font-semibold text-immich-primary dark:text-immich-dark-primary text-sm truncate">
          Immich
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {$t('view_in_app')}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <Button href={deepLinkUrl} size="small" shape="round">
        {$t('open')}
      </Button>
      <button
        type="button"
        onclick={dismiss}
        class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={$t('close')}
      >
        <Icon icon={mdiClose} size="20" />
      </button>
    </div>
  </div>
{/if}
