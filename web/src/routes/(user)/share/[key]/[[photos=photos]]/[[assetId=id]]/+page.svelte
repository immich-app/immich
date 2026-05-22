<script lang="ts">
  import SharedLinkPage from '$lib/components/pages/SharedLinkPage.svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();
</script>

<SharedLinkPage {data} />
