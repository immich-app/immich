<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import FaceCreateTagModal from '$lib/modals/CreateFaceModal.svelte';
  import { faceManager } from '$lib/stores/face.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { computeContentMetrics, mapContentRectToNatural, type Size } from '$lib/utils/container-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { createFace, getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, Input, modalManager, toastManager } from '@immich/ui';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { clamp } from 'lodash-es';
  import { onDestroy, onMount, tick } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    imageSize: Size;
    containerSize: Size;
    assetId: string;
  };

  let { imageSize, containerSize, assetId }: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let canvas: Canvas | undefined = $state();
  let faceRect: Rect | undefined = $state();
  let faceSelectorEl: HTMLDivElement | undefined = $state();
  let scrollableListEl: HTMLDivElement | undefined = $state();
  let searchInputEl: HTMLInputElement | null = $state(null);
  let page = $state(1);
  let candidates = $state<PersonResponseDto[]>([]);

  let searchTerm = $state('');
  let faceBoxPosition = $state({ left: 0, top: 0, width: 0, height: 0 });

  let filteredCandidates = $derived(
    searchTerm
      ? candidates.filter((person) => normalizeSearchString(person.name).includes(normalizeSearchString(searchTerm)))
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
    if (!canvasEl) {
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
    setDefaultFaceRectanglePosition(faceRect);
  };

  onMount(async () => {
    setupCanvas();
    await getPeople();
    await tick();
    searchInputEl?.focus();
  });

  const imageContentMetrics = $derived(computeContentMetrics(imageSize, containerSize));

  const setDefaultFaceRectanglePosition = (faceRect: Rect) => {
    const { offsetX, offsetY } = imageContentMetrics;

    faceRect.set({
      top: offsetY + 200,
      left: offsetX + 200,
    });

    faceRect.setCoords();
    positionFaceSelector();
  };

  $effect(() => {
    if (!canvas) {
      return;
    }

    canvas.setDimensions({
      width: containerSize.width,
      height: containerSize.height,
    });

    if (!faceRect) {
      return;
    }

    if (!isFaceRectIntersectingCanvas(faceRect, canvas)) {
      setDefaultFaceRectanglePosition(faceRect);
    }
  });

  const isFaceRectIntersectingCanvas = (faceRect: Rect, canvas: Canvas) => {
    const faceBox = faceRect.getBoundingRect();
    return !(
      0 > faceBox.left + faceBox.width ||
      0 > faceBox.top + faceBox.height ||
      canvas.width < faceBox.left ||
      canvas.height < faceBox.top
    );
  };

  const onClose = () => {
    assetViewerManager.closeFaceEditMode();
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
    const padding = faceRect.padding ?? 0;
    const rawBox = faceRect.getBoundingRect();
    const faceBox = {
      left: rawBox.left - padding,
      top: rawBox.top - padding,
      width: rawBox.width + padding * 2,
      height: rawBox.height + padding * 2,
    };
    const selectorWidth = faceSelectorEl.offsetWidth;
    const chromeHeight = faceSelectorEl.offsetHeight - scrollableListEl.offsetHeight;
    const listHeight = Math.min(MAX_LIST_HEIGHT, containerSize.height - gap * 2 - chromeHeight);
    const selectorHeight = listHeight + chromeHeight;

    const clampTop = (top: number) => clamp(top, gap, containerSize.height - selectorHeight - gap);
    const clampLeft = (left: number) => clamp(left, gap, containerSize.width - selectorWidth - gap);

    const overlapArea = (position: { top: number; left: number }) => {
      const selectorRight = position.left + selectorWidth;
      const selectorBottom = position.top + selectorHeight;
      const faceRight = faceBox.left + faceBox.width;
      const faceBottom = faceBox.top + faceBox.height;

      const overlapX = Math.max(0, Math.min(selectorRight, faceRight) - Math.max(position.left, faceBox.left));
      const overlapY = Math.max(0, Math.min(selectorBottom, faceBottom) - Math.max(position.top, faceBox.top));
      return overlapX * overlapY;
    };

    const faceBottom = faceBox.top + faceBox.height;
    const faceRight = faceBox.left + faceBox.width;

    const positions = [
      { top: clampTop(faceBottom + gap), left: clampLeft(faceBox.left) },
      { top: clampTop(faceBox.top - selectorHeight - gap), left: clampLeft(faceBox.left) },
      { top: clampTop(faceBox.top), left: clampLeft(faceRight + gap) },
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
    faceBoxPosition = { left: faceBox.left, top: faceBox.top, width: faceBox.width, height: faceBox.height };
  };

  $effect(() => {
    const rect = faceRect;
    const cvs = canvas;
    if (rect && cvs) {
      rect.on('moving', positionFaceSelector);
      rect.on('scaling', positionFaceSelector);
      cvs.on('object:modified', () => searchInputEl?.focus());
      return () => {
        rect.off('moving', positionFaceSelector);
        rect.off('scaling', positionFaceSelector);
        cvs.off('object:modified', () => searchInputEl?.focus());
      };
    }
  });

  const getFaceCroppedCoordinates = () => {
    if (!faceRect || imageContentMetrics.contentWidth === 0) {
      return;
    }

    const imageRect = mapContentRectToNatural(faceRect.getBoundingRect(), imageContentMetrics, imageSize);

    return {
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      x: Math.floor(imageRect.left),
      y: Math.floor(imageRect.top),
      width: Math.floor(imageRect.width),
      height: Math.floor(imageRect.height),
    };
  };

  type FaceCoordinates = NonNullable<ReturnType<typeof getFaceCroppedCoordinates>>;

  const getFacePreviewUrl = (data: FaceCoordinates) => {
    const imgRef = assetViewerManager.imgRef;
    if (!imgRef || imageContentMetrics.contentWidth === 0) {
      return;
    }

    const scaleX = imgRef.naturalWidth / imageSize.width;
    const scaleY = imgRef.naturalHeight / imageSize.height;
    const x = clamp(Math.floor(data.x * scaleX), 0, imgRef.naturalWidth - 1);
    const y = clamp(Math.floor(data.y * scaleY), 0, imgRef.naturalHeight - 1);
    const width = clamp(Math.floor(data.width * scaleX), 1, imgRef.naturalWidth - x);
    const height = clamp(Math.floor(data.height * scaleY), 1, imgRef.naturalHeight - y);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    try {
      canvas.getContext('2d')?.drawImage(imgRef, x, y, width, height, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } catch {
      return;
    }
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

      await assetViewerManager.setAssetId(assetId);
      faceManager.clear();
      onClose();
    } catch (error) {
      handleError(error, 'Error tagging face');
      onClose();
    }
  };

  const showCreateFaceModal = async () => {
    try {
      const data = getFaceCroppedCoordinates();
      if (!data) {
        return;
      }

      const created = await modalManager.show(FaceCreateTagModal, {
        assetId,
        ...data,
        previewUrl: getFacePreviewUrl(data),
      });
      if (!created) {
        return;
      }

      onClose();
    } catch (error) {
      handleError(error, 'Error creating and tagging face');
    }
  };

  onDestroy(() => {
    onClose();
  });
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose, ignoreInputFields: false }} />

<div
  id="face-editor-data"
  class="absolute inset-s-0 top-0 z-5 size-full overflow-hidden"
  data-overlay-interactive
  data-face-left={faceBoxPosition.left}
  data-face-top={faceBoxPosition.top}
  data-face-width={faceBoxPosition.width}
  data-face-height={faceBoxPosition.height}
>
  <canvas bind:this={canvasEl} id="face-editor" class="absolute inset-s-0 top-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="absolute inset-s-[calc(50%-125px)] top-[calc(50%-250px)] w-62.5 max-w-62.5 rounded-xl border border-gray-200 bg-white px-2 py-4 backdrop-blur-sm transition-[top,left] duration-200 ease-out dark:border-gray-800 dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <p class="text-center text-sm">{$t('select_person_to_tag')}</p>

    <div class="relative my-3">
      <Input placeholder={$t('search_people')} bind:value={searchTerm} bind:ref={searchInputEl} size="tiny" />
    </div>

    <div bind:this={scrollableListEl} class="mt-2 h-62.5 overflow-y-auto">
      {#if filteredCandidates.length > 0}
        <div class="mt-2 rounded-lg">
          {#each filteredCandidates as person (person.id)}
            <button
              onclick={() => tagFace(person)}
              type="button"
              class="flex w-full place-items-center gap-2 rounded-lg py-2 ps-1 pe-4 hover:bg-immich-primary/25"
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

    <Button size="small" fullWidth onclick={showCreateFaceModal} variant="outline" class="mt-2">
      {$t('create_person')}
    </Button>

    <Button size="small" fullWidth onclick={onClose} color="danger" class="mt-2">
      {$t('cancel')}
    </Button>
  </div>
</div>
