<script lang="ts">
  import { searchMediaTitle } from './search-bar-utils';
  import { MediaType } from '$lib/constants';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import SearchButton from './SearchButton.svelte';

  interface Props {
    title: string | undefined;
  }

  // eslint-disable-next-line no-useless-assignment
  let { title = $bindable() }: Props = $props();
  let filteredMedia = $derived(searchManager.filter.mediaType);

  const setMedia = (media: MediaType) => {
    searchManager.filter.mediaType = media;
    title = searchMediaTitle(media);
  };
</script>

<div id="media-type-selection">
  <fieldset>
    <Text class="pb-5">{$t('media_type_description')}</Text>

    <div class="flex flex-wrap gap-2">
      <SearchButton checked active={filteredMedia === MediaType.All} onclick={() => setMedia(MediaType.All)}>
        {$t('all')}
      </SearchButton>
      <SearchButton checked active={filteredMedia === MediaType.Image} onclick={() => setMedia(MediaType.Image)}>
        {$t('image')}
      </SearchButton>
      <SearchButton checked active={filteredMedia === MediaType.Video} onclick={() => setMedia(MediaType.Video)}>
        {$t('video')}
      </SearchButton>
    </div>
  </fieldset>
</div>
