<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
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

  const handleFocusOut = async () => {
    try {
      await updateAlbumInfo({
        id,
        updateAlbumDto: {
          description,
        },
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };
</script>

{#if isOwned}
  <Textarea
    bind:value={description}
    class="outline-none border-b border-gray-500 bg-transparent ring-0 focus:ring-0 resize-none focus:border-b-2 focus:border-immich-primary dark:focus:border-immich-dark-primary dark:bg-transparent"
    rows={1}
    grow
    shape="rectangle"
    onfocusout={handleFocusOut}
    placeholder={$t('add_a_description')}
    data-testid="autogrow-textarea"
    {@attach fromAction(shortcut, () => ({
      shortcut: { key: 'Enter', ctrl: true },
      onShortcut: (e) => e.currentTarget.blur(),
    }))}
  />
{:else if description}
  <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">
    {description}
  </p>
{/if}
