<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';

  interface Props {
    text: string;
  }

  let { text }: Props = $props();
  let showTooltip = $state(false);
</script>

<div class="relative inline-block">
  <button
    type="button"
    class="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
    onmouseenter={() => (showTooltip = true)}
    onmouseleave={() => (showTooltip = false)}
    onfocus={() => (showTooltip = true)}
    onblur={() => (showTooltip = false)}
    aria-describedby="tooltip"
  >
    <Icon icon={mdiInformationOutline} size="16" class="text-gray-500 dark:text-gray-400" />
  </button>

  {#if showTooltip}
    <div
      id="tooltip"
      role="tooltip"
      class="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
             text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg
             shadow-lg max-w-xs whitespace-normal text-left"
    >
      {text}
      <div
        class="absolute top-full left-1/2 -translate-x-1/2 border-4
                border-transparent border-t-gray-900 dark:border-t-gray-700"
      ></div>
    </div>
  {/if}
</div>
