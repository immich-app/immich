<script lang="ts">
  import Badge from '$lib/components/elements/badge.svelte';
  import { AppRoute } from '$lib/constants';
  import { isSharedLink } from '$lib/utils';
  import { type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  $: tags = asset.tags || [];
</script>

{#if isOwner && !isSharedLink() && tags.length > 0}
  <section class="px-4 pt-2">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <h2>{$t('tags').toUpperCase()}</h2>
    </div>
    <section class="flex flex-wrap pt-2 gap-1">
      {#each tags as tag (tag.id)}
        <a href={encodeURI(`${AppRoute.TAGS}/?path=${tag.value}`)}>
          <Badge rounded="full"><span class="text-xs px-1">{tag.value}</span></Badge>
        </a>
      {/each}
    </section>
  </section>
{/if}
