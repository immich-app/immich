<script lang="ts">
  import type { TypedSearchDisplayToken } from '$lib/utils/typed-search/typed-search-parser';

  interface Props {
    tokens: TypedSearchDisplayToken[];
  }

  let { tokens }: Props = $props();

  function tokenClass(status: TypedSearchDisplayToken['status']) {
    switch (status) {
      case 'error': {
        return 'border-red-400/70 bg-red-50 text-red-700 shadow-red-950/5 dark:border-red-400/40 dark:bg-red-950/35 dark:text-red-100';
      }
      case 'pending-entity': {
        return 'border-sky-300/70 bg-sky-50 text-sky-800 shadow-sky-950/5 dark:border-sky-400/35 dark:bg-sky-950/30 dark:text-sky-100';
      }
      case 'resolved-entity': {
        return 'border-emerald-300/70 bg-emerald-50 text-emerald-800 shadow-emerald-950/5 dark:border-emerald-400/35 dark:bg-emerald-950/30 dark:text-emerald-100';
      }
      case 'recognized': {
        return 'border-gray-200 bg-white/80 text-gray-800 shadow-gray-950/5 dark:border-gray-600/70 dark:bg-white/[0.07] dark:text-gray-100';
      }
    }
  }

  function keyClass(status: TypedSearchDisplayToken['status']) {
    switch (status) {
      case 'error': {
        return 'bg-red-100/80 text-red-700 dark:bg-red-400/10 dark:text-red-200';
      }
      case 'pending-entity': {
        return 'bg-sky-100/80 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200';
      }
      case 'resolved-entity': {
        return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200';
      }
      case 'recognized': {
        return 'bg-gray-100/90 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300';
      }
    }
  }
</script>

{#if tokens.length > 0}
  <div class="flex min-w-0 flex-wrap items-center gap-1.5 px-4 pt-2 pb-1" data-testid="typed-search-token-rail">
    {#each tokens as token (`${token.raw}:${token.status}`)}
      <span
        data-testid={`typed-search-token-${token.key}`}
        data-status={token.status}
        aria-label={token.issue?.message}
        class="inline-flex min-h-7 max-w-full items-stretch overflow-hidden rounded-full border text-xs leading-none shadow-sm
          shadow-black/5 ring-1 ring-white/10 {tokenClass(token.status)}"
      >
        <span
          data-testid={`typed-search-token-${token.key}-key`}
          class="flex items-center px-2 py-1.5 font-semibold uppercase tracking-[0.08em] {keyClass(token.status)}"
        >
          {token.key}
        </span>
        <span data-testid={`typed-search-token-${token.key}-value`} class="flex min-w-0 items-center px-2.5 py-1.5">
          <span class="truncate">{token.value}</span>
        </span>
      </span>
    {/each}
  </div>
{/if}
