<script lang="ts">
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { Button, Text } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let filters = $derived(searchManager.filter.display);
</script>

<div id="display-options-selection">
  <fieldset>
    <Text class="py-5" fontWeight="medium">{$t('library')}</Text>

    <div class="flex flex-wrap gap-2">
      <Button
        shape="round"
        color={filters.isFavorite ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => (filters.isFavorite = !filters.isFavorite)}
        class={filters.isFavorite ? undefined : 'bg-transparent'}
        leadingIcon={filters.isFavorite ? mdiCheck : undefined}
        >{$t('favorites')}
      </Button>
      <Button
        shape="round"
        color={filters.isArchive ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => (filters.isArchive = !filters.isArchive)}
        class={filters.isArchive ? undefined : 'bg-transparent'}
        leadingIcon={filters.isArchive ? mdiCheck : undefined}
        >{$t('archive')}
      </Button>
      <Button
        shape="round"
        color={filters.isNotInAlbum ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => (filters.isNotInAlbum = !filters.isNotInAlbum)}
        class={filters.isNotInAlbum ? undefined : 'bg-transparent'}
        leadingIcon={filters.isNotInAlbum ? mdiCheck : undefined}
        >{$t('search_filter_display_option_not_in_album')}
      </Button>
    </div>
  </fieldset>
</div>
