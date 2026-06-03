<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import FaceCreateTagModal from '$lib/modals/CreateFaceModal.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { computeContentMetrics, mapContentRectToNatural, type Size } from '$lib/utils/container-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { scaleFaceRectOnResize, type ResizeContext } from '$lib/utils/people-utils';
  import { createFace, getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, Input, modalManager, toastManager } from '@immich/ui';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { clamp } from 'lodash-es';
  import { onDestroy, onMount, tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    imageSize: Size;
    containerSize: Size;
    assetId: string;
  };

  let { imageSize, containerSize, assetId }: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let containerEl: HTMLDivElement | undefined = $state();
  let canvas: Canvas | undefined = $state();
  let faceRect: Rect | undefined = $state();
  let faceSelectorEl: HTMLDivElement | undefined = $state();
  let scrollableListEl: HTMLDivElement | undefined = $state();
  let searchInputEl: HTMLInputElement | null = $state(null);
  let page = $state(1);
  let candidates = $state<PersonResponseDto[]>([]);

  let searchTerm = $state('');
  let faceBoxPosition = $state({ left: 0, top: 0, width: 0, height: 0 });
  let userMovedRect = false;
  let previousMetrics: ResizeContext | null = null;
  let panModifierHeld = $state(false);

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
    if (!canvasEl) {
      return;
    }

    canvas = new Canvas(canvasEl, { width: containerSize.width, height: containerSize.height });
    canvas.selection = false;
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
    void getPeople();
    await tick();
    searchInputEl?.focus();
  });

  $effect(() => {
    if (!canvas) {
      return;
    }

    const upperCanvas = canvas.upperCanvasEl;
    const controller = new AbortController();
    const { signal } = controller;

    const stopIfOnTarget = (event: PointerEvent) => {
      if (canvas?.findTarget(event).target) {
        event.stopPropagation();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!canvas) {
        return;
      }
      if (canvas.findTarget(event).target) {
        event.stopPropagation();
        return;
      }
      if (faceRect) {
        event.stopPropagation();
        const pointer = canvas.getScenePoint(event);
        faceRect.set({ left: pointer.x, top: pointer.y });
        faceRect.setCoords();
        userMovedRect = true;
        canvas.renderAll();
        positionFaceSelector();
      }
    };

    upperCanvas.addEventListener('pointerdown', handlePointerDown, { signal });
    upperCanvas.addEventListener('pointermove', stopIfOnTarget, { signal });
    upperCanvas.addEventListener('pointerup', stopIfOnTarget, { signal });

    return () => {
      controller.abort();
    };
  });

  const imageContentMetrics = $derived(computeContentMetrics(imageSize, containerSize));

  const setDefaultFaceRectanglePosition = (faceRect: Rect) => {
    const { offsetX, offsetY, contentWidth, contentHeight } = imageContentMetrics;

    faceRect.set({
      top: offsetY + contentHeight / 2 - 56,
      left: offsetX + contentWidth / 2 - 56,
    });
  };

  $effect(() => {
    const { offsetX, offsetY, contentWidth } = imageContentMetrics;

    if (contentWidth === 0) {
      return;
    }

    const isFirstRun = previousMetrics === null;

    if (isFirstRun && !canvas) {
      setupCanvas();
    }

    if (!canvas || !faceRect) {
      return;
    }

    if (!isFirstRun) {
      canvas.setDimensions({ width: containerSize.width, height: containerSize.height });
    }

    if (!isFirstRun && userMovedRect && previousMetrics) {
      faceRect.set(scaleFaceRectOnResize(faceRect, previousMetrics, { contentWidth, offsetX, offsetY }));
    } else {
      setDefaultFaceRectanglePosition(faceRect);
    }

    faceRect.setCoords();
    previousMetrics = { contentWidth, offsetX, offsetY };
    canvas.renderAll();
    positionFaceSelector();
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
    if (Number.isNaN(rawBox.left) || Number.isNaN(rawBox.width)) {
      return;
    }
    const { currentZoom, currentPositionX, currentPositionY } = assetViewerManager.zoomState;
    const faceBox = {
      left: (rawBox.left - padding) * currentZoom + currentPositionX,
      top: (rawBox.top - padding) * currentZoom + currentPositionY,
      width: (rawBox.width + padding * 2) * currentZoom,
      height: (rawBox.height + padding * 2) * currentZoom,
    };
    const selectorWidth = faceSelectorEl.offsetWidth;
    const chromeHeight = faceSelectorEl.offsetHeight - scrollableListEl.offsetHeight;
    const listHeight = Math.min(MAX_LIST_HEIGHT, containerSize.height - gap * 2 - chromeHeight);
    const selectorHeight = listHeight + chromeHeight;

    const clampTop = (top: number) => clamp(top, gap, containerSize.height - selectorHeight - gap);
    const clampLeft = (left: number) => clamp(left, gap, containerSize.width - selectorWidth - gap);

    const faceRight = faceBox.left + faceBox.width;
    const faceBottom = faceBox.top + faceBox.height;

    const overlapArea = (position: { top: number; left: number }) => {
      const overlapX = Math.max(
        0,
        Math.min(position.left + selectorWidth, faceRight) - Math.max(position.left, faceBox.left),
      );
      const overlapY = Math.max(
        0,
        Math.min(position.top + selectorHeight, faceBottom) - Math.max(position.top, faceBox.top),
      );
      return overlapX * overlapY;
    };

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

    const containerRect = containerEl?.getBoundingClientRect();
    const offsetTop = containerRect?.top ?? 0;
    const offsetLeft = containerRect?.left ?? 0;
    faceSelectorEl.style.top = `${bestPosition.top + offsetTop}px`;
    faceSelectorEl.style.left = `${bestPosition.left + offsetLeft}px`;
    scrollableListEl.style.height = `${listHeight}px`;
    faceBoxPosition = faceBox;
  };

  $effect(() => {
    if (!canvas) {
      return;
    }

    const { currentZoom, currentPositionX, currentPositionY } = assetViewerManager.zoomState;
    canvas.setViewportTransform([currentZoom, 0, 0, currentZoom, currentPositionX, currentPositionY]);
    canvas.renderAll();
    positionFaceSelector();
  });

  $effect(() => {
    const rect = faceRect;
    const cvs = canvas;
    if (rect && cvs) {
      const onUserMove = () => {
        userMovedRect = true;
        positionFaceSelector();
      };
      rect.on('moving', onUserMove);
      rect.on('scaling', onUserMove);
      cvs.on('object:modified', () => searchInputEl?.focus());
      return () => {
        rect.off('moving', onUserMove);
        rect.off('scaling', onUserMove);
        cvs.off('object:modified', () => searchInputEl?.focus());
      };
    }
  });

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const panModifierKey = isMac ? 'Meta' : 'Control';
  const panModifierLabel = isMac ? '⌘' : 'Ctrl';
  const isZoomed = $derived(assetViewerManager.zoom > 1);

  $effect(() => {
    if (!containerEl) {
      return;
    }
    const element = containerEl;
    const parent = element.parentElement;

    const activate = () => {
      panModifierHeld = true;
      element.style.pointerEvents = 'none';
      if (parent) {
        parent.style.cursor = 'move';
      }
    };

    const deactivate = () => {
      panModifierHeld = false;
      element.style.pointerEvents = '';
      if (parent) {
        parent.style.cursor = '';
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === panModifierKey) {
        activate();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === panModifierKey) {
        deactivate();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', deactivate);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', deactivate);
      deactivate();
    };
  });

  const trapEvents = (node: HTMLElement) => {
    const stop = (e: Event) => e.stopPropagation();
    const eventTypes = ['keydown', 'pointerdown', 'pointermove', 'pointerup'] as const;
    for (const type of eventTypes) {
      node.addEventListener(type, stop);
    }

    document.body.append(node);

    return {
      destroy() {
        for (const type of eventTypes) {
          node.removeEventListener(type, stop);
        }
        node.remove();
      },
    };
  };

  const getFaceCroppedCoordinates = () => {
    if (!faceRect || imageSize.width === 0 || imageSize.height === 0) {
      return;
    }

    const scaledWidth = faceRect.getScaledWidth();
    const scaledHeight = faceRect.getScaledHeight();

    const imageRect = mapContentRectToNatural(
      {
        left: faceRect.left - scaledWidth / 2,
        top: faceRect.top - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight,
      },
      imageContentMetrics,
      imageSize,
    );

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
  bind:this={containerEl}
  class="absolute inset-s-0 top-0 z-5 size-full overflow-hidden"
  data-overlay-interactive
  data-face-left={faceBoxPosition.left}
  data-face-top={faceBoxPosition.top}
  data-face-width={faceBoxPosition.width}
  data-face-height={faceBoxPosition.height}
>
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 start-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="fixed z-20 w-[min(200px,45vw)] min-w-48 rounded-xl border border-gray-200 bg-white px-2 py-4 backdrop-blur-sm transition-[top,left] duration-200 ease-out dark:border-gray-800 dark:bg-immich-dark-gray dark:text-immich-dark-fg"
    use:trapEvents
    onwheel={(e) => e.stopPropagation()}
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

  {#if isZoomed && !panModifierHeld}
    <div
      transition:fade={{ duration: 200 }}
      class="pointer-events-none absolute inset-s-1/2 bottom-4 z-10 -translate-x-1/2"
    >
      <p class="whitespace-nowrap rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
        {$t('hold_key_to_pan', { values: { key: panModifierLabel } })}
      </p>
    </div>
  {/if}
</div>
