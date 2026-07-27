<script lang="ts">
  import { searchMediaTitle } from './search-bar-utils';
  import { MediaType } from '$lib/constants';
  import { Button, Text } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    filteredMedia: MediaType;
    title: string | undefined;
  }

  // eslint-disable-next-line no-useless-assignment
  let { filteredMedia = $bindable(), title = $bindable() }: Props = $props();

  const setMedia = (media: MediaType) => {
    filteredMedia = media;
    title = searchMediaTitle(media);
  };
</script>

<div id="media-type-selection">
  <fieldset>
    <Text class="pb-5">{$t('media_type_description')}</Text>

    <div class="flex flex-wrap gap-2">
      <Button
        shape="round"
        color={filteredMedia === MediaType.All ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => setMedia(MediaType.All)}
        class={filteredMedia === MediaType.All ? undefined : 'bg-transparent'}
        leadingIcon={filteredMedia === MediaType.All ? mdiCheck : undefined}
        >{$t('all')}
      </Button>
      <Button
        shape="round"
        color={filteredMedia === MediaType.Image ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => setMedia(MediaType.Image)}
        class={filteredMedia === MediaType.Image ? undefined : 'bg-transparent'}
        leadingIcon={filteredMedia === MediaType.Image ? mdiCheck : undefined}
        >{$t('image')}
      </Button>
      <Button
        shape="round"
        color={filteredMedia === MediaType.Video ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => setMedia(MediaType.Video)}
        class={filteredMedia === MediaType.Video ? undefined : 'bg-transparent'}
        leadingIcon={filteredMedia === MediaType.Video ? mdiCheck : undefined}
        >{$t('video')}
      </Button>
    </div>
  </fieldset>
</div>
