<script lang="ts">
  import { LockedGalleryManager } from '$lib/managers/locked-gallery-manager.svelte';
  import { Button } from '@immich/ui';
  import { onMount, untrack } from 'svelte';

  let {
    ids,
    deadline,
    busy,
    onRemove,
  }: { ids: string[]; deadline: number; busy: boolean; onRemove: (ids: string[]) => unknown } = $props();

  const gallery = new LockedGalleryManager(deadline);
  let mounted = $state(false);
  let selected = $state<string[]>([]);
  let dialog: HTMLDialogElement;
  const previewIndex = $derived(gallery.tiles.findIndex((tile) => tile.id === gallery.previewId));

  onMount(() => {
    gallery.mount();
    mounted = true;
    return () => {
      selected = [];
      gallery.destroy();
    };
  });

  $effect(() => {
    if (mounted) {
      selected = [];
      const currentIds = ids;
      untrack(() => {
        void gallery.load(currentIds);
      });
    }
  });

  $effect(() => {
    if (gallery.locked) {
      selected = [];
    }
  });

  $effect(() => {
    if (gallery.previewId && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!gallery.previewId && dialog?.open) {
      dialog.close();
    }
  });

  const move = (direction: number) => {
    const tile = gallery.tiles[previewIndex + direction];
    if (tile) {
      void gallery.preview(tile.id);
    }
  };

  const toggle = (id: string) => {
    selected = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
  };
</script>

{#if !gallery.locked}
  <div class="mt-3 flex flex-wrap items-center gap-3">
    <Button
      variant="outline"
      disabled={busy || selected.length === 0 || selected.length > 100}
      onclick={() => onRemove(selected)}>Remove selected group photos ({selected.length})</Button
    >
    <Button variant="ghost" disabled={selected.length === 0} onclick={() => (selected = [])}>Clear selection</Button>
    <p class="text-sm">Removing membership never deletes a photo. Open a photo for a private preview.</p>
  </div>
  <ul
    aria-label="Private group photos"
    class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
  >
    {#each gallery.tiles as tile, index (tile.id)}
      <li class="relative overflow-hidden rounded-lg border" class:ring-2={selected.includes(tile.id)}>
        <button
          type="button"
          class="block aspect-square w-full bg-black"
          aria-label={`Open photo ${index + 1}`}
          disabled={!tile.url}
          onclick={() => gallery.preview(tile.id)}
        >
          {#if tile.url}
            <img
              src={tile.url}
              alt={`Private ${tile.video ? 'video still' : 'photo'} ${index + 1}`}
              class="size-full object-cover"
              draggable="false"
            />
          {:else}
            <span class="text-sm text-white">{tile.failed ? 'Preview unavailable' : 'Loading…'}</span>
          {/if}
        </button>
        <label class="absolute top-2 left-2 flex items-center gap-2 rounded-sm bg-black/75 p-2 text-sm text-white">
          <input
            type="checkbox"
            aria-label={`Select photo ${index + 1}`}
            checked={selected.includes(tile.id)}
            disabled={busy || (!selected.includes(tile.id) && selected.length >= 100)}
            onchange={() => toggle(tile.id)}
          />
          {tile.video ? 'Video' : index + 1}
        </label>
      </li>
    {:else}
      <li class="col-span-full py-8 text-center text-sm">{busy ? 'Loading…' : 'No visible photos in this group.'}</li>
    {/each}
  </ul>
{/if}

<!-- A deliberately read-only viewer. No shared viewer state, routes, downloads,
     EXIF, originals, video playback or ordinary album actions escape this scope. -->
<dialog
  bind:this={dialog}
  aria-label="Private photo preview"
  class="m-auto max-h-[95dvh] w-[min(96vw,80rem)] rounded-lg bg-black p-4 text-white backdrop:bg-black/80"
  oncancel={() => gallery.closePreview()}
  onclose={() => gallery.closePreview()}
  onkeydown={(event) => {
    event.stopPropagation();
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  }}
>
  {#if gallery.previewId && !gallery.locked}
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p>Private preview · {previewIndex + 1} / {gallery.tiles.length}</p>
      <Button onclick={() => gallery.closePreview()}>Close preview</Button>
    </div>
    {#if gallery.previewUrl}
      <img
        src={gallery.previewUrl}
        alt="Selected private preview"
        class="mx-auto max-h-[75dvh] max-w-full object-contain"
        draggable="false"
      />
    {:else}
      <p role="status" class="p-12 text-center">{gallery.previewFailed ? 'Preview unavailable' : 'Loading…'}</p>
    {/if}
    <div class="mt-3 flex justify-between gap-3">
      <Button disabled={previewIndex <= 0} onclick={() => move(-1)}>Previous photo</Button>
      <Button disabled={previewIndex >= gallery.tiles.length - 1} onclick={() => move(1)}>Next photo</Button>
    </div>
  {/if}
</dialog>
