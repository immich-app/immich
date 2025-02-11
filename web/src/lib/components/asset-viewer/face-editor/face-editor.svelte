<script lang="ts">
  import CreatePeopleForm from '$lib/components/asset-viewer/face-editor/create-people-form.svelte';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { notificationController } from '$lib/components/shared-components/notification/notification';
  import { FaceEditorDisplayMode } from '$lib/constants';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getAllPeople, tagFace, type PersonResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { onMount } from 'svelte';

  interface Props {
    imgElement: HTMLImageElement;
    containerWidth: number;
    containerHeight: number;
    assetId: string;
  }

  let { imgElement, containerWidth, containerHeight, assetId }: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let canvas: Canvas | undefined = $state();
  let faceRect: Rect | undefined = $state();
  let faceSelectorEl: HTMLDivElement | undefined = $state();
  let displayMode: FaceEditorDisplayMode = $state(FaceEditorDisplayMode.EDITING);

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
    if (!canvasEl || !imgElement) {
      return;
    }

    canvas = new Canvas(canvasEl);
    configureControlStyle();

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
    const { actualWidth, actualHeight } = getContainedSize(imgElement);
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

  const getContainedSize = (img: HTMLImageElement): { actualWidth: number; actualHeight: number } => {
    const ratio = img.naturalWidth / img.naturalHeight;
    let actualWidth = img.height * ratio;
    let actualHeight = img.height;
    if (actualWidth > img.width) {
      actualWidth = img.width;
      actualHeight = img.width / ratio;
    }
    return { actualWidth, actualHeight };
  };

  const test = () => {
    console.log(faceRect?.getBoundingRect());
  };

  let page = $state(1);
  let candidates = $state<PersonResponseDto[]>([]);

  const getPeople = async () => {
    const { hasNextPage, people, total } = await getAllPeople({ page, size: 50, withHidden: false });

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

    let top = rect.top + rect.height + 15;
    let left = rect.left;

    if (top + selectorHeight > containerHeight) {
      top = rect.top - selectorHeight - 15;
    }

    if (left + selectorWidth > containerWidth) {
      left = containerWidth - selectorWidth - 15;
    }

    if (left < 0) {
      left = 15;
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

  const openCreatePersonForm = () => {
    displayMode = FaceEditorDisplayMode.CREATE_PERSON;
  };

  const getFaceCroppedCoordinates = () => {
    if (!faceRect || !imgElement) {
      return;
    }

    const { left, top, width, height } = faceRect.getBoundingRect();
    const { actualWidth, actualHeight } = getContainedSize(imgElement);

    const offsetArea = {
      width: (containerWidth - actualWidth) / 2,
      height: (containerHeight - actualHeight) / 2,
    };

    const x1Coeff = (left - offsetArea.width) / actualWidth;
    const y1Coeff = (top - offsetArea.height) / actualHeight;
    const x2Coeff = (left + width - offsetArea.width) / actualWidth;
    const y2Coeff = (top + height - offsetArea.height) / actualHeight;

    // transpose to the natural image location
    const x1 = x1Coeff * imgElement.naturalWidth;
    const y1 = y1Coeff * imgElement.naturalHeight;
    const x2 = x2Coeff * imgElement.naturalWidth;
    const y2 = y2Coeff * imgElement.naturalHeight;

    return {
      imageWidth: imgElement.naturalWidth,
      imageHeight: imgElement.naturalHeight,
      boundingBoxX1: Math.floor(x1),
      boundingBoxY1: Math.floor(y1),
      boundingBoxX2: Math.floor(x2),
      boundingBoxY2: Math.floor(y2),
    };
  };

  const tag = async (person: PersonResponseDto) => {
    const data = getFaceCroppedCoordinates();
    if (!data) {
      notificationController.show({
        message: 'Error tagging face - cannot geting bounding box coordinates',
      });
      return;
    }

    const isConfirmed = await dialogController.show({
      prompt: `Do you want to tag this face as ${person.name}?`,
    });

    if (!isConfirmed) {
      return;
    }

    await tagFace({
      tagFaceDto: {
        assetId,
        personId: person.id,
        ...data,
      },
    });
  };
</script>

<div class="absolute left-0 top-0">
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 left-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="absolute top-[calc(50%-250px)] left-[calc(50%-125px)] max-w-[250px] w-[250px] bg-white backdrop-blur-sm px-2 py-4 rounded-xl border border-gray-200"
  >
    <p class="text-center text-sm">Select a person to tag</p>

    {#if displayMode !== FaceEditorDisplayMode.CREATE_PERSON}
      <div class="max-h-[250px] overflow-y-auto mt-2">
        <div class="mt-2 rounded-lg">
          {#each candidates as person}
            <button
              onclick={() => tag(person)}
              type="button"
              class="w-full flex place-items-center gap-2 rounded-lg pl-1 pr-4 py-2 hover:bg-immich-primary/25"
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
      </div>
    {/if}

    {#if displayMode === FaceEditorDisplayMode.CREATE_PERSON}
      <CreatePeopleForm onDone={(person) => tag(person)} />
    {/if}

    {#if displayMode !== FaceEditorDisplayMode.CREATE_PERSON}
      <Button leadingIcon={mdiPlus} size="small" fullWidth class="mt-4" onclick={openCreatePersonForm}
        >Create new person</Button
      >
    {/if}
    <Button size="small" fullWidth onclick={test} color="danger" class="mt-2">Cancel</Button>
  </div>
</div>
