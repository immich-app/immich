<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { FaceEditorDisplayMode } from '$lib/constants';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Alert, Button, Checkbox, Field, HelperText, Input, PasswordInput, Stack, Switch, t } from '@immich/ui';
  import { mdiPlus } from '@mdi/js';
  import { error } from '@sveltejs/kit';
  import { Canvas, InteractiveFabricObject, Rect } from 'fabric';
  import { has } from 'lodash-es';
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
  let croppedFaceEl: HTMLCanvasElement | undefined = $state();
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

  const showCropFace = () => {
    if (!faceRect || !croppedFaceEl || !imgElement) {
      return;
    }

    const ctx = croppedFaceEl.getContext('2d');
    if (!ctx) {
      return;
    }

    const { left, top, width, height } = faceRect.getBoundingRect();
    const scaleX = imgElement.naturalWidth / imgElement.width;
    const scaleY = imgElement.naturalHeight / imgElement.height;

    const croppedWidth = width * scaleX;
    const croppedHeight = height * scaleY;

    const aspectRatio = croppedWidth / croppedHeight;
    let scaledWidth = 112;
    let scaledHeight = 112;

    if (aspectRatio > 1) {
      scaledHeight = 112 / aspectRatio;
    } else {
      scaledWidth = 112 * aspectRatio;
    }

    croppedFaceEl.width = 112;
    croppedFaceEl.height = 112;

    ctx.clearRect(0, 0, 112, 112);
    ctx.drawImage(
      imgElement,
      left * scaleX,
      top * scaleY,
      croppedWidth,
      croppedHeight,
      (112 - scaledWidth) / 2,
      (112 - scaledHeight) / 2,
      scaledWidth,
      scaledHeight,
    );
  };

  const confirmCrop = () => {
    // Put face faceSelectorEl on the bottom of the faceRect
    displayMode = FaceEditorDisplayMode.FACE_SELECTOR;
    showCropFace();
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
  >
    <p class="text-center text-sm">Select a person to tag</p>
    <div class="flex place-items-center place-content-center mt-2">
      <canvas
        id="cropped-face"
        bind:this={croppedFaceEl}
        class="border border-immich-primary/20 bg-gray-500 object-fill w-[112px] h-[112px] rounded-lg"
      ></canvas>
    </div>

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

  <!-- <form
    onsubmit={createPerson}
    autocomplete="off"
    id="create-new-user-form"
    hidden={displayMode !== FaceEditorDisplayMode.CREATE_PERSON}
  >
    <FullScreenModal title={'Create new person'} showLogo onClose={() => {}}>
      <Stack gap={4}>
        <Field label={'Person name'} required>
          <Input bind:value={personName} type="text" />
        </Field>
      </Stack>

      {#snippet stickyBottom()}
        <Button type="submit" fullWidth shape="round">Create and tag</Button>
      {/snippet}
    </FullScreenModal>
  </form> -->

  <!-- {#if displayMode === FaceEditorDisplayMode.EDITING} -->
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
  <!-- {/if} -->
</div>
