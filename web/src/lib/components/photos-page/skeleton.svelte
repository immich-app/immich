<script lang="ts">
  export let title: string | null = null;
  export let height: string | null = null;
</script>

<div class="overflow-clip" style={`height: ${height}`}>
  {#if title}
    <div
      class="flex z-[100] sticky top-0 pt-7 pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
    >
      <span class="w-full truncate first-letter:capitalize">{title}</span>
    </div>
  {/if}
  <div id="skeleton" style={`height: ${height}`}></div>
</div>

<style>
  #skeleton {
    background-image: url('/light_skeleton.png');
    background-repeat: repeat;
    background-size: 235px, 235px;
  }
  :global(.dark) #skeleton {
    background-image: url('/dark_skeleton.png');
  }
  @keyframes delayedVisibility {
    to {
      visibility: visible;
    }
  }
  #skeleton {
    visibility: hidden;
    animation: 0s linear 0.1s forwards delayedVisibility;
  }
</style>
