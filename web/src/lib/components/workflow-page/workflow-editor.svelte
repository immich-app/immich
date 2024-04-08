<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiPlus } from '@mdi/js';
</script>

<section class="h-full">
  <div id="workflow-control-bar" class="m-4 flex justify-between place-items-center gap-2">
    <div>
      <p class="uppercase text-lg dark:text-white">
        Add this photo to every albums and notify everybody about this glorious asset
      </p>
    </div>

    <div>
      <Button size="sm" color="red">Discard</Button>
      <Button size="sm">Disable</Button>
      <Button size="sm" color="green">Save</Button>
    </div>
  </div>

  <div>
    <div
      class="bg-green-800 text-white min-h-[60px] flex place-items-center place-content-center translate-y-3 mx-4 mt-2 rounded-2xl"
    >
      When an asset is uploaded
    </div>

    <div class="w-full flex place-items-center place-content-center">
      <div class="flex flex-col place-items-center z-10">
        <div class="rounded-full border-[6px] border-green-800 h-[20px] w-[20px] bg-white translate-y-1"></div>
        <div class="h-[60px] w-[5px] bg-white bg-gradient-to-b from-green-800 via-purple-800 to-indigo-900"></div>
        <div class="rounded-full border-[6px] border-indigo-900 h-[20px] w-[20px] bg-white -translate-y-1"></div>
      </div>
    </div>

    <div id="condition-blocks" class="-translate-y-3">
      <div class="bg-indigo-900 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4">
        And has Alex and Henry and Nate
      </div>

      <div
        class="bg-indigo-900 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        And from Nurnberg, Germany
      </div>

      <div
        class="border-2 border-indigo-500 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        <span><Icon path={mdiPlus} /></span> ADD RULE
      </div>
    </div>

    <div class="w-full flex place-items-center place-content-center -translate-y-6">
      <div class="flex flex-col place-items-center z-10">
        <div class="rounded-full border-[6px] border-indigo-900 h-[20px] w-[20px] bg-white translate-y-1"></div>
        <div class="h-[60px] w-[5px] bg-white bg-gradient-to-b from-indigo-900 via-indigo-800 to-gray-700"></div>
        <div class="rounded-full border-[6px] border-gray-700 h-[20px] w-[20px] bg-white -translate-y-1"></div>
      </div>
    </div>

    <div id="action-blocks" class="-translate-y-11">
      <div
        class="bg-gray-700 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        Add to Album
      </div>
      <div
        class="bg-gray-700 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        Send webhook to abc.com with payload 123
      </div>
      <div
        class="border-2 border-gray-500 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        <span><Icon path={mdiPlus} /></span> ADD ACTION
      </div>
    </div>
  </div>
</section>
