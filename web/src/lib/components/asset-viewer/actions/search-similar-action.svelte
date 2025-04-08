<script lang="ts">
  import { goto } from '$app/navigation';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { AppRoute } from '$lib/constants';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiImageSearchOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  function getSearchSimilarUrl() {
    const params = getMetadataSearchQuery({
      query: `similarTo:${asset.id}`,
    });
    return `${AppRoute.SEARCH}?${params}`;
  }

  async function handleClick(e: MouseEvent) {
    e.stopPropagation();

    await goto(getSearchSimilarUrl());
  }
</script>

<a href={getSearchSimilarUrl()} class="icon-link" onclick={handleClick}>
  <CircleIconButton color="opaque" icon={mdiImageSearchOutline} title={$t('search_similar_photos')} />
</a>

<style>
  .icon-link {
    display: inline-flex;
    text-decoration: none;
  }
</style>
