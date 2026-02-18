<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getDisplayMetrics, getNaturalSize } from '$lib/utils/container-utils';
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
    const metrics = getDisplayMetrics(htmlElement);

    const imageBoundingBox = {
      top: metrics.offsetY,
      left: metrics.offsetX,
      width: metrics.displayWidth,
      height: metrics.displayHeight,
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

  const positionFaceSelector = () => {
    if (!faceRect || !faceSelectorEl) {
      return;
    }

    const rect = faceRect.getBoundingRect();
    const selectorWidth = faceSelectorEl.offsetWidth;
    const selectorHeight = faceSelectorEl.offsetHeight;

    const spaceAbove = rect.top;
    const spaceBelow = containerHeight - (rect.top + rect.height);
    const spaceLeft = rect.left;
    const spaceRight = containerWidth - (rect.left + rect.width);

    let top, left;

    if (
      spaceBelow >= selectorHeight ||
      (spaceBelow >= spaceAbove && spaceBelow >= spaceLeft && spaceBelow >= spaceRight)
    ) {
      top = rect.top + rect.height + 15;
      left = rect.left;
    } else if (
      spaceAbove >= selectorHeight ||
      (spaceAbove >= spaceBelow && spaceAbove >= spaceLeft && spaceAbove >= spaceRight)
    ) {
      top = rect.top - selectorHeight - 15;
      left = rect.left;
    } else if (
      spaceRight >= selectorWidth ||
      (spaceRight >= spaceLeft && spaceRight >= spaceAbove && spaceRight >= spaceBelow)
    ) {
      top = rect.top;
      left = rect.left + rect.width + 15;
    } else {
      top = rect.top;
      left = rect.left - selectorWidth - 15;
    }

    if (left + selectorWidth > containerWidth) {
      left = containerWidth - selectorWidth - 15;
    }

    if (left < 0) {
      left = 15;
    }

    if (top + selectorHeight > containerHeight) {
      top = containerHeight - selectorHeight - 15;
    }

    if (top < 0) {
      top = 15;
    }

    faceSelectorEl.style.top = `${top}px`;
    faceSelectorEl.style.left = `${left}px`;
  };

  $effect(() => {
    if (faceRect) {
      faceRect.on('moving', positionFaceSelector);
      faceRect.on('scaling', positionFaceSelector);
    }
  });

  const getFaceCroppedCoordinates = () => {
    if (!faceRect || !htmlElement) {
      return;
    }

    const { left, top, width, height } = faceRect.getBoundingRect();
    const metrics = getDisplayMetrics(htmlElement);
    const natural = getNaturalSize(htmlElement);

    const x1Coeff = (left - metrics.offsetX) / metrics.displayWidth;
    const y1Coeff = (top - metrics.offsetY) / metrics.displayHeight;
    const x2Coeff = (left + width - metrics.offsetX) / metrics.displayWidth;
    const y2Coeff = (top + height - metrics.offsetY) / metrics.displayHeight;

    return {
      imageWidth: natural.width,
      imageHeight: natural.height,
      x: Math.floor(x1Coeff * natural.width),
      y: Math.floor(y1Coeff * natural.height),
      width: Math.floor((x2Coeff - x1Coeff) * natural.width),
      height: Math.floor((y2Coeff - y1Coeff) * natural.height),
    };
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

<div class="absolute start-0 top-0">
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 start-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="absolute top-[calc(50%-250px)] start-[calc(50%-125px)] max-w-[250px] w-[250px] bg-white dark:bg-immich-dark-gray dark:text-immich-dark-fg backdrop-blur-sm px-2 py-4 rounded-xl border border-gray-200 dark:border-gray-800"
  >
    <p class="text-center text-sm">{$t('select_person_to_tag')}</p>

    <div class="my-3 relative">
      <Input placeholder={$t('search_people')} bind:value={searchTerm} size="tiny" />
    </div>

    <div class="h-62.5 overflow-y-auto mt-2">
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
