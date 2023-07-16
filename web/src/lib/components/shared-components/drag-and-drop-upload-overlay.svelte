<script lang="ts">
  import { fade } from 'svelte/transition';
  import ImmichLogo from './immich-logo.svelte';
  export let dropHandler: (event: DragEvent) => void;

  let dragStartTarget: EventTarget | null = null;

  const handleDragEnter = (e: DragEvent) => {
    dragStartTarget = e.target;
  };
</script>

<svelte:body
  on:dragenter|stopPropagation|preventDefault={handleDragEnter}
  on:dragleave|stopPropagation|preventDefault={(e) => {
    if (dragStartTarget === e.target) {
      dragStartTarget = null;
    }
  }}
  on:drop|stopPropagation|preventDefault={(e) => {
    dragStartTarget = null;
    dropHandler(e);
  }}
/>

{#if dragStartTarget}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 w-full h-full z-[1000] flex flex-col items-center justify-center bg-gray-100/90 dark:bg-immich-dark-bg/90 text-immich-dark-gray dark:text-immich-gray"
    transition:fade={{ duration: 250 }}
    on:dragover={(e) => {
      // Prevent browser from opening the dropped file.
      e.stopPropagation();
      e.preventDefault();
    }}
  >
    <ImmichLogo class="animate-bounce w-48 m-16" />
    <div class="text-2xl">Drop files anywhere to upload</div>
  </div>
{/if}
