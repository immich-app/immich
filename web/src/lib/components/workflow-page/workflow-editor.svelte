<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
</script>

<section class="h-full dark:bg-zinc-900">
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
        <div class="rounded-full border-[6px] border-indigo-800 h-[20px] w-[20px] bg-white -translate-y-1"></div>
      </div>
    </div>

    <div id="condition-blocks" class="-translate-y-3">
      <div class="bg-indigo-800 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4">
        And has Alex and Henry and Nate
      </div>

      <div
        class="bg-indigo-800 text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        And from Nurnberg, Germany
      </div>
    </div>

    <div class="w-full flex place-items-center place-content-center">
      <div class="flex flex-col place-items-center z-10">
        <div class="rounded-full border-[6px] border-indigo-800 h-[20px] w-[20px] bg-white translate-y-1"></div>
        <div class="h-[60px] w-[5px] bg-white bg-gradient-to-b from-indigo-800 via-purple-800 to-indigo-900"></div>
        <div class="rounded-full border-[6px] border-indigo-800 h-[20px] w-[20px] bg-white -translate-y-1"></div>
      </div>
    </div>

    <div id="action-blocks">
      <div class="w-full bg-gray-700 text-white min-h-[60px] flex place-items-center place-content-center">
        Add to Album
      </div>
      <div class="w-full bg-gray-700 text-white min-h-[60px] flex place-items-center place-content-center">
        Send webhook to abc.com with payload 123
      </div>
    </div>
  </div>
</section>
