<script lang="ts">
  import RepresentativeFaceTile from '$lib/components/people/representative-face-tile.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import type { PersonFacePageResponseDto, PersonFaceResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type PageRequest = { page: number; size: number };

  interface Props {
    title: string;
    loadFaces: (request: PageRequest) => Promise<PersonFacePageResponseDto>;
    updateFace: (faceId: string) => Promise<void>;
    getThumbnailUrl: (face: PersonFaceResponseDto) => string;
    onClose: (updated?: boolean) => void;
    resetFace?: () => Promise<void>;
    canUpdate?: boolean;
  }

  let { title, loadFaces, updateFace, getThumbnailUrl, onClose, resetFace, canUpdate = true }: Props = $props();

  const pageSize = 50;
  const skeletonTiles = Array.from({ length: 18 }, (_, index) => index);
  let page = $state(1);
  let faces: PersonFaceResponseDto[] = $state([]);
  let hasNextPage = $state(false);
  let loading = $state(true);
  let loadFailed = $state(false);
  let loadingMore = $state(false);
  let pendingFaceId = $state<string | null>(null);
  let resetting = $state(false);

  async function loadPage(nextPage: number) {
    const response = await loadFaces({ page: nextPage, size: pageSize });
    faces = nextPage === 1 ? response.faces : [...faces, ...response.faces];
    hasNextPage = response.hasNextPage;
    page = nextPage;
  }

  onMount(async () => {
    try {
      loadFailed = false;
      await loadPage(1);
    } catch (error) {
      loadFailed = true;
      handleError(error, $t('errors.unable_to_load_faces'));
    } finally {
      loading = false;
    }
  });

  async function selectFace(faceId: string) {
    if (!canUpdate) {
      return;
    }

    try {
      pendingFaceId = faceId;
      await updateFace(faceId);
      toastManager.primary($t('representative_face_updated'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_representative_face'));
    } finally {
      pendingFaceId = null;
    }
  }

  async function loadMore() {
    try {
      loadingMore = true;
      await loadPage(page + 1);
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_faces'));
    } finally {
      loadingMore = false;
    }
  }

  async function reset() {
    if (!resetFace || !canUpdate) {
      return;
    }

    try {
      resetting = true;
      await resetFace();
      toastManager.primary($t('representative_face_inherited'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_representative_face'));
    } finally {
      resetting = false;
    }
  }
</script>

<Modal {title} size="large" onClose={() => onClose(false)}>
  <ModalBody>
    <div class="min-h-80">
      {#if loading}
        <div
          data-testid="representative-face-grid"
          class="grid grid-cols-[repeat(auto-fill,88px)] justify-center gap-2 sm:grid-cols-[repeat(auto-fill,112px)]"
        >
          {#each skeletonTiles as skeletonTile (skeletonTile)}
            <div
              data-testid="representative-face-skeleton"
              class="aspect-square animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            ></div>
          {/each}
        </div>
      {:else if loadFailed}
        <p class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{$t('errors.unable_to_load_faces')}</p>
      {:else if faces.length === 0}
        <p class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{$t('no_faces_found')}</p>
      {:else}
        <div
          data-testid="representative-face-grid"
          class="grid grid-cols-[repeat(auto-fill,88px)] justify-center gap-2 sm:grid-cols-[repeat(auto-fill,112px)]"
        >
          {#each faces as face (face.id)}
            <RepresentativeFaceTile
              faceId={face.id}
              thumbnailUrl={getThumbnailUrl(face)}
              selected={face.isRepresentative}
              disabled={!canUpdate || !!pendingFaceId || resetting}
              pending={pendingFaceId === face.id}
              onSelect={selectFace}
            />
          {/each}
        </div>
      {/if}
    </div>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth gap={3}>
      {#if resetFace && canUpdate}
        <Button shape="round" color="secondary" disabled={resetting || !!pendingFaceId} onclick={reset}>
          {$t('use_inherited_thumbnail')}
        </Button>
      {/if}
      {#if hasNextPage}
        <Button
          shape="round"
          color="secondary"
          disabled={loadingMore || !!pendingFaceId || resetting}
          onclick={loadMore}
        >
          {loadingMore ? $t('loading') : $t('load_more')}
        </Button>
      {/if}
    </HStack>
  </ModalFooter>
</Modal>
