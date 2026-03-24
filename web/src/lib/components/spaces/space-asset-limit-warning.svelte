<script lang="ts" module>
  export const MAX_SPACE_ASSETS_PER_REQUEST = 10_000;
</script>

<script lang="ts">
  import FormatMessage from '$lib/elements/FormatMessage.svelte';

  interface Props {
    selectedCount: number;
  }

  let { selectedCount }: Props = $props();
</script>

{#if selectedCount > MAX_SPACE_ASSETS_PER_REQUEST}
  <div
    data-testid="asset-limit-warning"
    class="fixed top-16 left-1/2 z-[1000] w-fit max-w-xl -translate-x-1/2 rounded-lg bg-red-100 p-3 text-sm text-red-800 shadow-lg dark:bg-red-900 dark:text-red-200"
  >
    <FormatMessage key="space_asset_limit_warning">
      {#snippet children({ tag, message })}
        {#if tag === 'link'}
          <a
            href="https://github.com/open-noodle/gallery/blob/main/docs/docs/features/shared-spaces.md#got-a-lot-of-photos"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
          >
            {message}
          </a>
        {:else}
          {message}
        {/if}
      {/snippet}
    </FormatMessage>
  </div>
{/if}
