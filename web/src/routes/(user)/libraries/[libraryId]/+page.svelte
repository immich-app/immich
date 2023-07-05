<script lang="ts">
  import LibraryViewer from '$lib/components/library-page/library-viewer.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="immich-scrollbar">
  <LibraryViewer library={data.library} />
</div>
