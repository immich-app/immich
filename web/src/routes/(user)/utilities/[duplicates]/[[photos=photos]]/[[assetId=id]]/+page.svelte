<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getAssetDuplicates, type AssetResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';

  import type { PageData } from './$types';
  export let data: PageData;
  let assets: AssetResponseDto[] = [];

  onMount(async () => {
    assets = await getAssetDuplicates();
    console.log(assets);
  });
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>OK</UserPageLayout>
