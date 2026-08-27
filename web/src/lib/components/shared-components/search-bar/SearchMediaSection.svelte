<script lang="ts">
  import { MediaType } from '$lib/constants';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import SearchButton from './SearchButton.svelte';

  let filteredMedia = $derived(searchManager.filter.mediaType);
</script>

<div id="media-type-selection">
  <fieldset>
    <Text class="pb-5">{$t('media_type_description')}</Text>

    <div class="flex flex-wrap gap-2">
      <SearchButton
        checked
        active={filteredMedia === MediaType.All}
        onclick={() => (searchManager.filter.mediaType = MediaType.All)}
      >
        {$t('all')}
      </SearchButton>
      <SearchButton
        checked
        active={filteredMedia === MediaType.Image}
        onclick={() => (searchManager.filter.mediaType = MediaType.Image)}
      >
        {$t('image')}
      </SearchButton>
      <SearchButton
        checked
        active={filteredMedia === MediaType.Video}
        onclick={() => (searchManager.filter.mediaType = MediaType.Video)}
      >
        {$t('video')}
      </SearchButton>
    </div>
  </fieldset>
</div>
