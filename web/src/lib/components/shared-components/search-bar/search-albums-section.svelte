<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    selectedAlbums: SvelteSet<string>;
  }

  let { selectedAlbums = $bindable() }: Props = $props();

  let allAlbums: AlbumResponseDto[] = $state([]);
  let albumMap = $derived(Object.fromEntries(allAlbums.map((album) => [album.id, album])));
  let selectedOption = $state(undefined);

  let sortedSelectedAlbums = $derived(
    Array.from(selectedAlbums).sort((a, b) => albumMap[b]?.albumName?.length - albumMap[a]?.albumName?.length),
  );

  onMount(async () => {
    allAlbums = await getAllAlbums({});
  });

  const handleSelect = (option?: ComboBoxOption) => {
    if (!option || !option.id) {
      return;
    }

    selectedAlbums.add(option.value);

    selectedOption = undefined;
  };

  const handleRemove = (album: string) => {
    selectedAlbums.delete(album);
  };
</script>

<div id="location-selection">
  <form autocomplete="off" id="create-album-form">
    <div class="my-4 flex flex-col gap-2">
      <Combobox
        onSelect={handleSelect}
        hasThumbnails
        label={$t('albums').toUpperCase()}
        defaultFirstOption
        options={allAlbums.map((album) => ({
          id: album.id,
          label: album.albumName,
          value: album.id,
          thumbnail: album.albumThumbnailAssetId ? getAssetThumbnailUrl(album.albumThumbnailAssetId) : undefined,
        }))}
        bind:selectedOption
        placeholder={$t('search_albums')}
      />
    </div>
  </form>

  <section class="flex flex-wrap pt-2 gap-1">
    {#each sortedSelectedAlbums as albumId (albumId)}
      {@const album = albumMap[albumId]}
      {#if album}
        <div class="album-chip-container flex group transition-all">
          <span
            class="album-chip inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary roudned-s-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
          >
            <p class="text-sm album-chip">
              {album.albumName}
            </p>
          </span>

          <button
            type="button"
            class="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
            title={$t('remove_album')}
            onclick={() => handleRemove(albumId)}
          >
            <Icon path={mdiClose} />
          </button>
        </div>
      {/if}
    {/each}
  </section>
</div>

<style>
  .album-chip-container {
    max-width: 100%;
  }
  .album-chip {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
