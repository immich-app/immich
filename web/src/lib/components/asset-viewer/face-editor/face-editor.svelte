<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import FaceCreateTagModal from '$lib/modals/CreateFaceModal.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getNaturalSize, scaleToFit } from '$lib/utils/container-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { createFace, getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, Input, modalManager, toastManager } from '@immich/ui';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { clamp } from 'lodash-es';
  import { onDestroy, onMount, tick } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    htmlElement: HTMLImageElement | HTMLVideoElement;
    containerWidth: number;
    containerHeight: number;
    assetId: string;
  };

  let { htmlElement, containerWidth, containerHeight, assetId }: Props = $props();

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
    setDefaultFaceRectanglePosition(faceRect);
  };

  onMount(async () => {
    setupCanvas();
    await getPeople();
    await tick();
    searchInputEl?.focus();
  });

  const imageContentMetrics = $derived.by(() => {
    const natural = getNaturalSize(htmlElement);
    const container = { width: containerWidth, height: containerHeight };
    const { width: contentWidth, height: contentHeight } = scaleToFit(natural, container);
    return {
      contentWidth,
      contentHeight,
      offsetX: (containerWidth - contentWidth) / 2,
      offsetY: (containerHeight - contentHeight) / 2,
    };
  });

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
      width: containerWidth,
      height: containerHeight,
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
    const listHeight = Math.min(MAX_LIST_HEIGHT, containerHeight - gap * 2 - chromeHeight);
    const selectorHeight = listHeight + chromeHeight;

    const clampTop = (top: number) => clamp(top, gap, containerHeight - selectorHeight - gap);
    const clampLeft = (left: number) => clamp(left, gap, containerWidth - selectorWidth - gap);

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
    if (!faceRect || !htmlElement) {
      return;
    }

    const { left, top, width, height } = faceRect.getBoundingRect();
    const { offsetX, offsetY, contentWidth, contentHeight } = imageContentMetrics;
    const natural = getNaturalSize(htmlElement);

    const scaleX = natural.width / contentWidth;
    const scaleY = natural.height / contentHeight;
    const imageX = (left - offsetX) * scaleX;
    const imageY = (top - offsetY) * scaleY;

    return {
      imageWidth: natural.width,
      imageHeight: natural.height,
      x: Math.floor(imageX),
      y: Math.floor(imageY),
      width: Math.floor(width * scaleX),
      height: Math.floor(height * scaleY),
    };
  };

  type FaceCoordinates = NonNullable<ReturnType<typeof getFaceCroppedCoordinates>>;

  const getFacePreviewUrl = (data: FaceCoordinates) => {
    if (!htmlElement) {
      return;
    }

    const natural = getNaturalSize(htmlElement);
    if (natural.width <= 0 || natural.height <= 0) {
      return;
    }

    const x = clamp(data.x, 0, natural.width - 1);
    const y = clamp(data.y, 0, natural.height - 1);
    const width = clamp(data.width, 1, natural.width - x);
    const height = clamp(data.height, 1, natural.height - y);

    if (width <= 0 || height <= 0) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    try {
      context.drawImage(htmlElement, x, y, width, height, 0, 0, width, height);
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
    } catch (error) {
      handleError(error, 'Error tagging face');
    } finally {
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
  class="absolute inset-s-0 top-0 z-5 h-full w-full overflow-hidden"
  data-overlay-interactive
  data-face-left={faceBoxPosition.left}
  data-face-top={faceBoxPosition.top}
  data-face-width={faceBoxPosition.width}
  data-face-height={faceBoxPosition.height}
>
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 inset-s-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="absolute top-[calc(50%-250px)] inset-s-[calc(50%-125px)] max-w-62.5 w-62.5 bg-white dark:bg-immich-dark-gray dark:text-immich-dark-fg backdrop-blur-sm px-2 py-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-[top,left] duration-200 ease-out"
  >
    <p class="text-center text-sm">{$t('select_person_to_tag')}</p>

    <div class="my-3 relative">
      <Input placeholder={$t('search_people')} bind:value={searchTerm} bind:ref={searchInputEl} size="tiny" />
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

    <Button size="small" fullWidth onclick={showCreateFaceModal} variant="outline" class="mt-2">
      {$t('create_person')}
    </Button>

    <Button size="small" fullWidth onclick={onClose} color="danger" class="mt-2">
      {$t('cancel')}
    </Button>
  </div>
</div>
