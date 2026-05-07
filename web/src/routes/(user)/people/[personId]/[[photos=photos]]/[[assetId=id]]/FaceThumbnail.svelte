<script lang="ts">
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';

  interface Props {
    person: PersonResponseDto;
    selectable?: boolean;
    selected?: boolean;
    thumbnailSize?: number | null;
    circle?: boolean;
    border?: boolean;
    onClick?: (person: PersonResponseDto) => void;
  }

  let {
    person,
    selectable = false,
    selected = false,
    thumbnailSize = null,
    circle = false,
    border = false,
    onClick = () => {},
  }: Props = $props();
</script>

<button
  type="button"
  class="relative rounded-lg transition-all"
  onclick={() => onClick(person)}
  disabled={!selectable}
  style:width={thumbnailSize ? thumbnailSize + 'px' : '100%'}
  style:height={thumbnailSize ? thumbnailSize + 'px' : '100%'}
>
  <div
    class="size-full border-2 brightness-90 filter"
    class:rounded-full={circle}
    class:rounded-lg={!circle}
    class:border-transparent={!border}
    class:dark:border-immich-dark-primary={border}
    class:border-immich-primary={border}
  >
    <ImageThumbnail {circle} url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="100%" shadow />
  </div>

  <div
    class="absolute inset-s-0 top-0 size-full bg-immich-primary/30 opacity-0"
    class:hover:opacity-100={selectable}
    class:rounded-full={circle}
    class:rounded-lg={!circle}
  ></div>

  {#if selected}
    <div
      class="absolute inset-s-0 top-0 size-full bg-blue-500/80"
      class:rounded-full={circle}
      class:rounded-lg={!circle}
    ></div>
  {/if}

  {#if person.name}
    <span
      class="text-white-shadow absolute inset-s-0 bottom-2 w-full px-1 text-center font-medium text-ellipsis text-white hover:cursor-pointer"
    >
      {person.name}
    </span>
  {/if}
</button>
