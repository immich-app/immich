<script lang="ts">
  import ImageEditor from 'tui-image-editor';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  let editorElement: HTMLDivElement;
  let instance: ImageEditor;

  onMount(async () => {
    await browser;
    instance = new ImageEditor(editorElement, {
      cssMaxWidth: 700,
      cssMaxHeight: 500,
      selectionStyle: {
        rotatingPointOffset: 70,
        cornerSize: 20,
      },
    });
  });
</script>

<div class="absolute h-screen w-screen z-[9999]" bind:this={editorElement} />
