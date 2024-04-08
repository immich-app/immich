<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import WorkflowCard from '$lib/components/workflow-page/workflow-card.svelte';
</script>

<section id="workflow-list" class="border-r border-gray-800 h-full relative overflow-scroll pr-2">
  <div class="sticky top-0 dark:bg-immich-dark-bg flex justify-between place-items-center pr-2 py-4">
    <p class="text-xs dark:text-white">CURRENT WORKFLOWS</p>
    <Button size="sm">New Workflow</Button>
  </div>

  <div>
    {#each Array.from({ length: 50 }) as _}
      <WorkflowCard />
    {/each}
  </div>
</section>
