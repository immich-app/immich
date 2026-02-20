<script lang="ts">
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiMinus, mdiOpenInNew, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';

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

  const handleAddToMerge = () => {
    onClick(person);
  };
</script>

<div class="group relative" tabindex={selectable ? 0 : -1} role={selectable ? 'group' : undefined}>
  <div
    class="relative rounded-lg transition-all"
    style:width={thumbnailSize ? thumbnailSize + 'px' : '100%'}
    style:height={thumbnailSize ? thumbnailSize + 'px' : '100%'}
  >
    <div
      class="h-full w-full border-2 brightness-90 filter"
      class:rounded-full={circle}
      class:rounded-lg={!circle}
      class:border-transparent={!border}
      class:dark:border-immich-dark-primary={border}
      class:border-immich-primary={border}
    >
      <ImageThumbnail {circle} url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="100%" shadow />
    </div>

    {#if person.name}
      <span
        class="w-100 text-white-shadow absolute bottom-2 start-0 w-full text-ellipsis px-1 text-center font-medium text-white"
      >
        {person.name}
      </span>
    {/if}
  </div>

  {#if selectable}
    <div
      class="absolute left-1/2 -bottom-6 hidden -translate-x-1/2 gap-2 group-hover:flex group-focus-within:flex [@media(hover:none)]:flex"
    >
      <IconButton
        icon={mdiOpenInNew}
        href="/people/{person.id}"
        target="_blank"
        aria-label={$t('open_in_new_tab')}
        size="small"
        color="primary"
      />
      <IconButton
        icon={selected ? mdiMinus : mdiPlus}
        onclick={handleAddToMerge}
        aria-label={selected ? $t('remove_from_merge') : $t('add_to_merge')}
        size="small"
        color="primary"
      />
    </div>
  {/if}
</div>
