<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo } from '@immich/sdk';
  import { Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  interface Props {
    id: string;
    description: string;
    isOwned: boolean;
  }

  let { id, description = $bindable(), isOwned }: Props = $props();

  // keep unsaved edits local so an album refresh (e.g. from an upload) does not overwrite them
  let newDescription = $derived(description);

  const handleFocusOut = async () => {
    if (newDescription === description) {
      return;
    }

    try {
      const response = await updateAlbumInfo({
        id,
        updateAlbumDto: {
          description: newDescription || null,
        },
      });
      ({ description } = response);
      eventManager.emit('AlbumUpdate', response);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };
</script>

{#if isOwned}
  <Textarea
    bind:value={newDescription}
    variant="ghost"
    onfocusout={handleFocusOut}
    placeholder={$t('add_a_description')}
    data-testid="autogrow-textarea"
    class="max-h-32"
    {@attach fromAction(shortcut, () => ({
      shortcut: { key: 'Enter', ctrl: true },
      onShortcut: (e) => e.currentTarget.blur(),
    }))}
  />
{:else if description}
  <p class="wrap-break-words w-full text-base whitespace-pre-line text-black dark:text-white">
    {description}
  </p>
{/if}
