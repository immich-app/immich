<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiImageBrokenVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let square = false;
  export let noMessage = false;
</script>

<section class="flex h-full w-full justify-center">
  <div
    class="px-auto flex flex-col {square
      ? 'aspect-square'
      : 'w-full'} h-full items-center justify-center bg-gray-100 dark:text-gray-100 dark:bg-immich-dark-gray"
  >
    <slot name="message">
      {#if !noMessage}
        <div class="text-lg absolute top-2/3">{$t('error_loading_image')}</div>
      {/if}
    </slot>
    <div class="flex h-full w-full items-center justify-center p-4 bg-gray-100 dark:text-slate-200 dark:bg-gray-700">
      <Icon path={mdiImageBrokenVariant} size="33%" />
    </div>
  </div>
</section>
