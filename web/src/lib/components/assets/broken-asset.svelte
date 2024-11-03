<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiImageBrokenVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    class?: string;
    hideMessage?: boolean;
    width?: string | undefined;
    height?: string | undefined;
  }

  let { class: className = '', hideMessage = false, width = undefined, height = undefined }: Props = $props();
</script>

<div
  class="flex flex-col overflow-hidden max-h-full max-w-full justify-center items-center bg-gray-100 dark:bg-gray-700 dark:text-gray-100 p-4 {className}"
  style:width
  style:height
>
  <Icon path={mdiImageBrokenVariant} size="7em" class="max-w-full" />
  {#if !hideMessage}
    <span class="text-center">{$t('error_loading_image')}</span>
  {/if}
</div>
