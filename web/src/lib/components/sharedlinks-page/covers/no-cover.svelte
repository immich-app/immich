<script lang="ts">
  export let alt = '';
  export let preload = false;
  let className = '';
  export { className as class };
</script>

<enhanced:img
  {alt}
  class="z-0 rounded-xl object-cover {className}"
  data-testid="album-image"
  draggable="false"
  loading={preload ? 'eager' : 'lazy'}
  sizes="min(271px,186px)"
  src="$lib/assets/no-thumbnail.png"
/>
