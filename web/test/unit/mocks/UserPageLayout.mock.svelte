<script lang="ts">
  interface Props {
    buttons?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { buttons, children }: Props = $props();
</script>

<section>
  {@render buttons?.()}
  {@render children?.()}
</section>
