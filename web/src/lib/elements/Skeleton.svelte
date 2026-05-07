<script lang="ts">
  interface Props {
    height: number;
    title?: string;
    invisible?: boolean;
  }

  let { height = 0, title, invisible = false }: Props = $props();
</script>

<div class={['overflow-clip', { invisible }]} style:height={height + 'px'}>
  {#if title}
    <div
      class="flex h-6 place-items-center pt-7 pb-5 text-xs font-medium text-immich-fg max-md:pt-5 max-md:pb-3 md:text-sm dark:text-immich-dark-fg"
    >
      {title}
    </div>
  {/if}
  <div class="size-full animate-pulse" data-skeleton="true"></div>
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
  .invisible [data-skeleton] {
    visibility: hidden !important;
  }
</style>
