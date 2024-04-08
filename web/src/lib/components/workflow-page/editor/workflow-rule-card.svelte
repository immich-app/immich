<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiPencil, mdiTrashCan } from '@mdi/js';
</script>

<div
  class="bg-gray-700 text-white min-h-[60px] grid grid-cols-[15%_70%_15%] place-items-center place-content-center rounded-2xl mx-4 mt-2 p-2"
>
  <p class="col-start-2 col-span-1">And has Alex and Henry and Nate</p>

  <div class="col-start-3 col-span-1 flex gap-2 justify-self-end">
    <CircleIconButton size="20" padding="2" title="Remove rule" icon={mdiTrashCan} />
    <CircleIconButton size="20" padding="2" title="Edit rule" icon={mdiPencil} />
  </div>
</div>
