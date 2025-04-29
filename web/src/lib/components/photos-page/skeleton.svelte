<script lang="ts">
  interface Props {
    height: number;
    title: string;
  }

  let { height = 0, title }: Props = $props();
</script>

<div class="overflow-clip" style:height={height + 'px'}>
  <div
    class="flex z-[100] pt-[calc(1.75rem+1px)] pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
  >
    {title}
  </div>
  <div
    class="animate-pulse absolute h-full ms-[10px] me-[10px]"
    style:width="calc(100% - 20px)"
    data-skeleton="true"
  ></div>
</div>

<style>
  [data-skeleton] {
    background-image: url('/light_skeleton.png');
    background-repeat: repeat;
    background-size: 235px, 235px;
  }
  @media (max-width: 767px) {
    [data-skeleton] {
      background-size: 100px, 100px;
    }
  }
  :global(.dark) [data-skeleton] {
    background-image: url('/dark_skeleton.png');
  }
  @keyframes delayedVisibility {
    to {
      visibility: visible;
    }
  }
  [data-skeleton] {
    visibility: hidden;
    animation:
      0s linear 0.1s forwards delayedVisibility,
      pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
