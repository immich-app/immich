<script lang="ts">
  import LibrarySettings from '$lib/components/library-page/library-settings.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="immich-scrollbar">
  <LibrarySettings library={data.library} />
</div>
