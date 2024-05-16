<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getAssetDuplicates, type AssetResponseDto } from '@immich/sdk';
  import type { Viewport } from '$lib/stores/assets.store';
  import { onMount } from 'svelte';

  import type { PageData } from './$types';
  export let data: PageData;
  let assets: AssetResponseDto[] = [];

  const viewport: Viewport = { width: 0, height: 0 };

  onMount(async () => {
    assets = await getAssetDuplicates();
  });
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>OK</UserPageLayout>
