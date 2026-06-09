<script lang="ts">
  export let widthPercent: number = 12;
</script>

<div class="mt-4 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-immich-dark-bg/80">
  <div
    class="h-full rounded-full bg-immich-primary transition-[width] duration-300"
    style={`width: ${widthPercent}%`}
  ></div>
</div>
