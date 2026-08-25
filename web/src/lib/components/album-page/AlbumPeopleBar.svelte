<script lang="ts">
  import { getAlbumPeople, scanAlbumFaces, type AlbumPeopleResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { IconButton, toastManager } from '@immich/ui';
  import { mdiFaceRecognition } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';

  interface Props {
    albumId: string;
    /** currently active person filter (person id or null) */
    filter: string | null;
    /** if true the owner (or editor) can trigger a face scan for this album */
    canScan: boolean;
    onFilter: (personId: string | null) => void;
  }

  let { albumId, filter, canScan, onFilter }: Props = $props();

  let people: AlbumPeopleResponseDto[] = $state([]);
  let scanning = $state(false);

  const load = async () => {
    try {
      people = await getAlbumPeople({ id: albumId });
    } catch {
      people = [];
    }
  };

  const scan = async () => {
    if (scanning) {
      return;
    }
    scanning = true;
    try {
      const result = await scanAlbumFaces({ id: albumId });
      if (result.queued > 0) {
        toastManager.primary(
          $t('scan_faces_queued', {
            values: {
              count: result.queued,
              skipped: result.skipped,
            },
          }),
        );
        // face detection + clustering runs in the background; refresh people afterwards
        window.setTimeout(() => void load(), 10000);
      } else {
        toastManager.primary($t('scan_faces_no_faces'));
      }
    } catch {
      toastManager.error($t('scan_faces_error'));
    } finally {
      scanning = false;
    }
  };

  onMount(() => {
    void load();
  });
</script>

{#if people.length > 0 || canScan}
  <div class="my-3 flex items-center gap-4 overflow-x-auto pb-1">
    {#if people.length > 0}
      <span class="shrink-0 text-xs uppercase text-immich-fg/60 dark:text-immich-dark-fg/60">
        {$t('album_people')}
      </span>
    {/if}

    {#each people as person (person.id)}
      <button
        type="button"
        class="flex shrink-0 flex-col items-center gap-1 focus:outline-none"
        onclick={() => onFilter(filter === person.id ? null : person.id)}
        title={person.name || $t('person')}
      >
        <div
          class="rounded-full ring-3 {filter === person.id
            ? 'ring-immich-primary dark:ring-immich-dark-primary'
            : 'ring-transparent hover:ring-immich-primary/40'}"
        >
          <ImageThumbnail
            circle
            shadow
            url={getPeopleThumbnailUrl(person as PersonResponseDto)}
            altText={person.name}
            title={person.name}
            widthStyle="72px"
            preload={false}
          />
        </div>
        <span class="max-w-18 truncate text-xs text-immich-fg dark:text-immich-dark-fg">
          {person.name || $t('person')}
        </span>
      </button>
    {/each}

    {#if canScan}
      <div class="flex shrink-0 flex-col items-center gap-1 ps-2">
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          icon={mdiFaceRecognition}
          aria-label={$t('run_face_recognition')}
          title={$t('run_face_recognition')}
          disabled={scanning}
          onclick={scan}
        />
        <span class="max-w-18 truncate text-xs text-immich-fg dark:text-immich-dark-fg">
          {$t('run_face_recognition')}
        </span>
      </div>
    {/if}
  </div>
{/if}
