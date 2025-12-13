<script lang="ts">
  interface Props {
    alt?: string;
    preload?: boolean;
    class?: string;
  }

  let { alt = '', preload = false, class: className = '' }: Props = $props();
</script>

<enhanced:img
  {alt}
  class="size-full rounded-xl object-cover aspect-square {className}"
  data-testid="album-image"
  draggable="false"
  loading={preload ? 'eager' : 'lazy'}
  sizes="min(271px,186px)"
  src="$lib/assets/no-thumbnail.png"
/>
