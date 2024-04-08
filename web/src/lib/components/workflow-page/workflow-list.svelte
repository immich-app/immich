<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import WorkflowCard from '$lib/components/workflow-page/workflow-card.svelte';
</script>

<section id="workflow-list" class="border-r border-gray-600 h-full relative overflow-scroll">
  <div class="sticky top-0 dark:bg-immich-dark-bg flex justify-between place-items-center pr-2 py-4">
    <p class="text-xs dark:text-white">CURRENT WORKFLOW</p>
    <Button size="sm">New Workflow</Button>
  </div>

  <div>
    {#each Array.from({ length: 50 }) as _, i}
      <WorkflowCard />
    {/each}
  </div>
</section>
