<script lang="ts">
  import { mdiContentDuplicate } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
</script>

<div class="border border-gray-300 rounded-3xl pt-4 pb-6 dark:text-white">
  <p class="text-xs font-medium p-4">ORGANIZE YOUR LIBRARY</p>

  <button class="w-full hover:bg-gray-100 dark:hover:bg-immich-dark-gray flex gap-4 p-4">
    <span
      ><Icon path={mdiContentDuplicate} class="text-immich-primary dark:text-immich-dark-primary" size="24" />
    </span>
    <p>Manage photos duplication</p>
  </button>
</div>
