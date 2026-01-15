<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { createFace, getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, Input, modalManager, toastManager } from '@immich/ui';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    htmlElement: HTMLImageElement | HTMLVideoElement;
    containerWidth: number;
    containerHeight: number;
    assetId: string;
  }

  let { htmlElement, containerWidth, containerHeight, assetId }: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let canvas: Canvas | undefined = $state();
  let faceRect: Rect | undefined = $state();
  let faceSelectorEl: HTMLDivElement | undefined = $state();
  let scrollableListEl: HTMLDivElement | undefined = $state();
  let page = $state(1);
  let candidates = $state<PersonResponseDto[]>([]);

  let searchTerm = $state('');

  let filteredCandidates = $derived(
    searchTerm
      ? candidates.filter((person) => person.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : candidates,
  );

  const configureControlStyle = () => {
    InteractiveFabricObject.ownDefaults = {
      ...InteractiveFabricObject.ownDefaults,
      cornerStyle: 'circle',
      cornerColor: 'rgb(153,166,251)',
      cornerSize: 10,
      padding: 8,
      transparentCorners: false,
      lockRotation: true,
      hasBorders: true,
    };
  };

  const setupCanvas = () => {
    if (!canvasEl || !htmlElement) {
      return;
    }

    canvas = new Canvas(canvasEl);
    configureControlStyle();

    // eslint-disable-next-line tscompat/tscompat
    faceRect = new Rect({
      fill: 'rgba(66,80,175,0.25)',
      stroke: 'rgb(66,80,175)',
      strokeWidth: 2,
      strokeUniform: true,
      width: 112,
      height: 112,
      objectCaching: true,
      rx: 8,
      ry: 8,
    });

    canvas.add(faceRect);
    canvas.setActiveObject(faceRect);
  };

  onMount(async () => {
    setupCanvas();
    await getPeople();
  });

  $effect(() => {
    const { actualWidth, actualHeight } = getContainedSize(htmlElement);
    const offsetArea = {
      width: (containerWidth - actualWidth) / 2,
      height: (containerHeight - actualHeight) / 2,
    };

    const imageBoundingBox = {
      top: offsetArea.height,
      left: offsetArea.width,
      width: containerWidth - offsetArea.width * 2,
      height: containerHeight - offsetArea.height * 2,
    };

    if (!canvas) {
      return;
    }

    canvas.setDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    if (!faceRect) {
      return;
    }

    faceRect.set({
      top: imageBoundingBox.top + 200,
      left: imageBoundingBox.left + 200,
    });

    faceRect.setCoords();
    positionFaceSelector();
  });

  const getNaturalSize = (element: HTMLImageElement | HTMLVideoElement) => {
    if (element instanceof HTMLImageElement) {
      return {
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        displayWidth: element.width,
        displayHeight: element.height,
      };
    }
    return {
      naturalWidth: element.videoWidth,
      naturalHeight: element.videoHeight,
      displayWidth: element.clientWidth,
      displayHeight: element.clientHeight,
    };
  };

  const getContainedSize = (element: HTMLImageElement | HTMLVideoElement) => {
    const { naturalWidth, naturalHeight, displayWidth, displayHeight } = getNaturalSize(element);
    const ratio = naturalWidth / naturalHeight;
    let actualWidth = displayHeight * ratio;
    let actualHeight = displayHeight;
    if (actualWidth > displayWidth) {
      actualWidth = displayWidth;
      actualHeight = displayWidth / ratio;
    }
    return { actualWidth, actualHeight };
  };

  const cancel = () => {
    isFaceEditMode.value = false;
  };

  const getPeople = async () => {
    const { hasNextPage, people, total } = await getAllPeople({ page, size: 1000, withHidden: false });

    if (candidates.length === total) {
      return;
    }

    candidates = [...candidates, ...people];

    if (hasNextPage) {
      page++;
    }
  };

  const MAX_LIST_HEIGHT = 250;

  const positionFaceSelector = () => {
    if (!faceRect || !faceSelectorEl || !scrollableListEl) {
      return;
    }

    const gap = 15;
    const faceBox = faceRect.getBoundingRect();
    const selectorWidth = faceSelectorEl.offsetWidth;
    const chromeHeight = faceSelectorEl.offsetHeight - scrollableListEl.offsetHeight;
    const listHeight = Math.min(MAX_LIST_HEIGHT, containerHeight - gap * 2 - chromeHeight);
    const selectorHeight = listHeight + chromeHeight;

    const clampTop = (top: number) => Math.max(gap, Math.min(top, containerHeight - selectorHeight - gap));
    const clampLeft = (left: number) => Math.max(gap, Math.min(left, containerWidth - selectorWidth - gap));

    const overlapArea = (position: { top: number; left: number }) => {
      const overlapX = Math.max(
        0,
        Math.min(position.left + selectorWidth, faceBox.left + faceBox.width) - Math.max(position.left, faceBox.left),
      );
      const overlapY = Math.max(
        0,
        Math.min(position.top + selectorHeight, faceBox.top + faceBox.height) - Math.max(position.top, faceBox.top),
      );
      return overlapX * overlapY;
    };

    // Try placing the selector: below, above, right of, or left of the face box
    const positions = [
      { top: clampTop(faceBox.top + faceBox.height + gap), left: clampLeft(faceBox.left) },
      { top: clampTop(faceBox.top - selectorHeight - gap), left: clampLeft(faceBox.left) },
      { top: clampTop(faceBox.top), left: clampLeft(faceBox.left + faceBox.width + gap) },
      { top: clampTop(faceBox.top), left: clampLeft(faceBox.left - selectorWidth - gap) },
    ];

    let bestPosition = positions[0];
    let leastOverlap = Infinity;

    for (const position of positions) {
      const overlap = overlapArea(position);
      if (overlap < leastOverlap) {
        leastOverlap = overlap;
        bestPosition = position;
        if (overlap === 0) {
          break;
        }
      }
    }

    faceSelectorEl.style.top = `${bestPosition.top}px`;
    faceSelectorEl.style.left = `${bestPosition.left}px`;
    scrollableListEl.style.height = `${listHeight}px`;
  };

  $effect(() => {
    const rect = faceRect;
    if (rect) {
      rect.on('moving', positionFaceSelector);
      rect.on('scaling', positionFaceSelector);
      return () => {
        rect.off('moving', positionFaceSelector);
        rect.off('scaling', positionFaceSelector);
      };
    }
  });

  const getFaceCroppedCoordinates = () => {
    if (!faceRect || !htmlElement) {
      return;
    }

    const faceBox = faceRect.getBoundingRect();
    const { actualWidth, actualHeight } = getContainedSize(htmlElement);
    const { naturalWidth, naturalHeight } = getNaturalSize(htmlElement);

    const offsetX = (containerWidth - actualWidth) / 2;
    const offsetY = (containerHeight - actualHeight) / 2;

    const x = Math.floor(((faceBox.left - offsetX) / actualWidth) * naturalWidth);
    const y = Math.floor(((faceBox.top - offsetY) / actualHeight) * naturalHeight);
    const width = Math.floor((faceBox.width / actualWidth) * naturalWidth);
    const height = Math.floor((faceBox.height / actualHeight) * naturalHeight);

    return { imageWidth: naturalWidth, imageHeight: naturalHeight, x, y, width, height };
  };

  const tagFace = async (person: PersonResponseDto) => {
    try {
      const data = getFaceCroppedCoordinates();
      if (!data) {
        toastManager.warning($t('error_tag_face_bounding_box'));
        return;
      }

      const isConfirmed = await modalManager.showDialog({
        prompt: person.name
          ? $t('confirm_tag_face', { values: { name: person.name } })
          : $t('confirm_tag_face_unnamed'),
      });

      if (!isConfirmed) {
        return;
      }

      await createFace({
        assetFaceCreateDto: {
          assetId,
          personId: person.id,
          ...data,
        },
      });

      await assetViewingStore.setAssetId(assetId);
    } catch (error) {
      handleError(error, 'Error tagging face');
    } finally {
      isFaceEditMode.value = false;
    }
  };
</script>

<div class="absolute start-0 top-0 z-5 h-full w-full overflow-hidden">
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 start-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="absolute top-[calc(50%-250px)] start-[calc(50%-125px)] max-w-[250px] w-[250px] bg-white dark:bg-immich-dark-gray dark:text-immich-dark-fg backdrop-blur-sm px-2 py-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-[top,left] duration-200 ease-out"
  >
    <p class="text-center text-sm">{$t('select_person_to_tag')}</p>

    <div class="my-3 relative">
      <Input placeholder={$t('search_people')} bind:value={searchTerm} size="tiny" />
    </div>

    <div bind:this={scrollableListEl} class="h-62.5 overflow-y-auto mt-2">
      {#if filteredCandidates.length > 0}
        <div class="mt-2 rounded-lg">
          {#each filteredCandidates as person (person.id)}
            <button
              onclick={() => tagFace(person)}
              type="button"
              class="w-full flex place-items-center gap-2 rounded-lg ps-1 pe-4 py-2 hover:bg-immich-primary/25"
            >
              <ImageThumbnail
                curve
                shadow
                url={getPeopleThumbnailUrl(person)}
                altText={person.name}
                title={person.name}
                widthStyle="30px"
                heightStyle="30px"
              />
              <p class="text-sm">
                {person.name}
              </p>
            </button>
          {/each}
        </div>
      {:else}
        <div class="flex items-center justify-center py-4">
          <p class="text-sm text-gray-500">{$t('no_people_found')}</p>
        </div>
      {/if}
    </div>

    <Button size="small" fullWidth onclick={cancel} color="danger" class="mt-2">{$t('cancel')}</Button>
  </div>
</div>
