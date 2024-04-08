<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import WorkflowActionCard from '$lib/components/workflow-page/editor/workflow-action-card.svelte';
  import WorkflowRuleCard from '$lib/components/workflow-page/editor/workflow-rule-card.svelte';
  import WorkflowTriggerCard from '$lib/components/workflow-page/editor/workflow-trigger-card.svelte';
  import { mdiPlus } from '@mdi/js';
</script>

<section class="h-full overflow-scroll">
  <div
    id="workflow-control-bar"
    class="sticky top-0 flex justify-between place-items-center border-b border-gray-200 dark:border-gray-800 p-4 bg-zinc-50 dark:bg-zinc-900 z-20"
  >
    <p class="uppercase text-lg dark:text-white font-medium">
      Add this photo to every albums and notify everybody about this glorious asset
    </p>

    <div class="flex gap-2">
      <Button size="sm" color="red">Discard</Button>
      <Button size="sm">Disable</Button>
      <Button size="sm" color="green">Save</Button>
    </div>
  </div>

  <div id="workflows-selection">
    <!-- TRIGGER BLOCK -->
    <div class="translate-y-3">
      <p class="pl-4 text-xs dark:text-gray-300">TRIGGER</p>
      <WorkflowTriggerCard />
    </div>

    <!-- VISUAL CONNECTOR -->
    <div class="relative w-full grid grid-cols-3 place-items-center place-content-center z-10">
      <p class="col-start-1 col-span-1 justify-self-start self-end pl-4 pb-6 text-xs dark:text-gray-300">RULES</p>
      <div class="col-start-2 col-span-1 flex flex-col place-items-center">
        <div
          class="rounded-full border-[6px] border-immich-primary dark:border-immich-dark-primary h-[20px] w-[20px] bg-white translate-y-1"
        ></div>
        <div
          class="h-[60px] w-[5px] bg-white bg-gradient-to-b from-immich-primary dark:from-immich-dark-primary via-zinc-300 dark:via-gray-600 dark:to-zinc-700"
        ></div>
        <div
          class="rounded-full border-[6px] border-zinc-200 dark:border-gray-700 h-[20px] w-[20px] bg-white -translate-y-1"
        ></div>
      </div>
    </div>

    <!-- RULES BLOCK -->
    <div id="rule-block" class="-translate-y-6">
      <WorkflowRuleCard />
      <WorkflowRuleCard />

      <div
        class="border-2 dark:border-gray-700 dark:text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        <span><Icon path={mdiPlus} /></span> ADD RULE
      </div>
    </div>

    <!-- VISUAL CONNECTOR -->
    <div class="relative w-full grid grid-cols-3 place-items-center place-content-center -translate-y-9 z-10">
      <p class="col-start-1 col-span-1 justify-self-start self-end pl-4 pb-6 text-xs dark:text-gray-300">ACTIONS</p>
      <div class="col-start-2 col-span-1 flex flex-col place-items-center">
        <div class="rounded-full border-[6px] border-gray-900 h-[20px] w-[20px] bg-white translate-y-1"></div>
        <div class="h-[60px] w-[5px] bg-white bg-gradient-to-b from-gray-900 via-indigo-800 to-gray-700"></div>
        <div class="rounded-full border-[6px] border-gray-700 h-[20px] w-[20px] bg-white -translate-y-1"></div>
      </div>
    </div>

    <!-- ACTION BLOCK -->
    <div id="action-block" class="-translate-y-14">
      <WorkflowActionCard />
      <WorkflowActionCard />
      <div
        class="border-2 dark:border-gray-500 dark:text-white min-h-[60px] flex place-items-center place-content-center rounded-2xl mx-4 mt-2"
      >
        <span><Icon path={mdiPlus} /></span> ADD ACTION
      </div>
    </div>
  </div>
</section>
