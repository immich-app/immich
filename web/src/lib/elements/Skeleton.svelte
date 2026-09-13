<script lang="ts">
  import { cleanClass } from '$lib';
  import { getBasePath } from '$lib/base-path';

  interface Props {
    height: number;
    title?: string;
    invisible?: boolean;
    class?: string;
  }

  let { height = 0, title, invisible = false, class: className }: Props = $props();
</script>

<div
  class={cleanClass('overflow-clip', invisible && 'invisible', className)}
  style={`height: ${height}px; --immich-light-skeleton: url('${getBasePath()}/light_skeleton.png'); --immich-dark-skeleton: url('${getBasePath()}/dark_skeleton.png')`}
>
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
    background-image: var(--immich-light-skeleton);
    background-repeat: repeat;
    background-size: 235px, 235px;
  }
  @media (max-width: 767px) {
    [data-skeleton] {
      background-size: 100px, 100px;
    }
  }
  :global(.dark) [data-skeleton] {
    background-image: var(--immich-dark-skeleton);
  }
  .invisible [data-skeleton] {
    visibility: hidden !important;
  }
</style>
