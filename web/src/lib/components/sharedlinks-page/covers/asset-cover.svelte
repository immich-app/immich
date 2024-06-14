<script lang="ts">
  export let alt;
  export let preload = false;
  export let src: string;
  let className = '';
  export { className as class };
</script>

<img
  {alt}
  class="z-0 rounded-xl object-cover {className}"
  data-testid="album-image"
  draggable="false"
  loading={preload ? 'eager' : 'lazy'}
  {src}
/>
