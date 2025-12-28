<script lang="ts">
  type Props = {
    animated?: boolean;
  };

  let { animated = true }: Props = $props();
</script>

<div class="flex justify-center py-2">
  <div class="relative h-12 w-0.5">
    <div class="absolute inset-0 bg-linear-to-b from-primary/30 via-primary/50 to-primary/30"></div>
    {#if animated}
      <div class="absolute inset-0 bg-linear-to-b from-transparent via-primary to-transparent flow-pulse"></div>
    {/if}
    <div class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
      <div class="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
    </div>
    <div class="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2">
      <div class="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
    </div>
  </div>
</div>

<style>
  @keyframes flow {
    0% {
      transform: translateY(-25%);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(25%);
      opacity: 0;
    }
  }

  .flow-pulse {
    animation: flow 2s ease-in-out infinite;
  }
</style>
