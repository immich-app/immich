<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { FaceEditorDisplayMode } from '$lib/constants';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, Checkbox, Field, Input, Stack } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { onMount } from 'svelte';

  interface Props {
    imgElement: HTMLImageElement;
    containerWidth: number;
    containerHeight: number;
  }

  let { imgElement, containerWidth, containerHeight }: Props = $props();

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
      fill: 'rgba(255,255,255,0.75)',
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

    // canvas.centerObject(faceRect);
    faceRect.set({
      top: imageBoundingBox.top,
      left: imageBoundingBox.left,
    });

    // Update controls border
    faceRect.setCoords();
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

  const confirmCrop = () => {
    // Put face faceSelectorEl on the bottom of the faceRect
    displayMode = FaceEditorDisplayMode.FACE_SELECTOR;
    positionFaceSelector();
    // canvas?.discardActiveObject();
    // faceRect?.set({ selectable: false });
  };

  const openCreatePersonForm = () => {
    displayMode = FaceEditorDisplayMode.CREATE_PERSON;
  };

  let personName = $state('');
  const createPerson = (event: Event) => {
    event.preventDefault();
  };
</script>

<div class="absolute left-0 top-0">
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 left-0"></canvas>

  <div
    id="face-selector"
    bind:this={faceSelectorEl}
    class="absolute top-[calc(50%-250px)] left-[calc(50%-125px)] max-w-[250px] w-[250px] bg-white backdrop-blur-sm px-2 py-4 rounded-xl border border-gray-200"
    hidden={displayMode == FaceEditorDisplayMode.EDITING}
  >
    <p class="text-center text-sm">Select a person to tag</p>

    {#if displayMode !== FaceEditorDisplayMode.CREATE_PERSON}
      <div class="max-h-[300px] overflow-y-auto mt-2">
        <div class="mt-2 rounded-lg">
          {#each candidates as person}
            <button
              onclick={() => {}}
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
      <form onsubmit={createPerson} autocomplete="off" id="create-new-person-form" class="mt-4 text-sm">
        <Stack gap={4}>
          <Field label={'Person name'} required>
            <Input bind:value={personName} type="text" />
          </Field>

          <Field label="Favorite">
            <Checkbox checked />
          </Field>
        </Stack>

        <Button leadingIcon={mdiPlus} size="small" fullWidth class="mt-4" onclick={openCreatePersonForm}
          >Create and tag</Button
        >
      </form>
    {/if}

    {#if displayMode !== FaceEditorDisplayMode.CREATE_PERSON}
      <Button leadingIcon={mdiPlus} size="small" fullWidth class="mt-4" onclick={openCreatePersonForm}
        >Create new person</Button
      >
    {/if}
  </div>

  {#if displayMode === FaceEditorDisplayMode.EDITING}
    <div
      id="face-editor-controller"
      class="absolute bottom-20 right-[calc(50%-167px)] bg-gray-50/75 backdrop-blur-sm p-4 rounded-xl"
    >
      <div>
        <p>Create a new person or tag an existing one</p>
      </div>
      <div class="flex gap-2 place-items-center place-content-center mt-4">
        <Button size="small" onclick={confirmCrop} class="shadow-xl font-normal">Confirm</Button>
        <Button size="small" onclick={test} color="danger">Cancel</Button>
      </div>
    </div>
  {/if}
</div>
