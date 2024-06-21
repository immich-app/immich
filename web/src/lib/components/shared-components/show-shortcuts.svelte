<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import { mdiInformationOutline } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { t } from 'svelte-i18n';

  interface Shortcuts {
    general: ExplainedShortcut[];
    actions: ExplainedShortcut[];
  }

  interface ExplainedShortcut {
    key: string[];
    action: string;
    info?: string;
  }

  const shortcuts: Shortcuts = {
    general: [
      { key: ['←', '→'], action: $t('previous_or_next_photo') },
      { key: ['Esc'], action: $t('back_close_deselect') },
      { key: ['Ctrl', 'k'], action: $t('search_your_photos') },
      { key: ['Ctrl', '⇧', 'k'], action: $t('open_the_search_filters') },
    ],
    actions: [
      { key: ['f'], action: $t('favorite_or_unfavorite_photo') },
      { key: ['i'], action: $t('show_or_hide_info') },
      { key: ['s'], action: $t('stack_selected_photos') },
      { key: ['⇧', 'a'], action: $t('archive_or_unarchive_photo') },
      { key: ['⇧', 'd'], action: $t('download') },
      { key: ['Space'], action: $t('play_or_pause_video') },
      { key: ['Del'], action: $t('trash_delete_asset'), info: $t('shift_to_permanent_delete') },
    ],
  };
  const dispatch = createEventDispatcher<{
    close: void;
  }>();
</script>

<FullScreenModal title={$t('keyboard_shortcuts')} width="auto" onClose={() => dispatch('close')}>
  <div class="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
    <div class="p-4">
      <h2>{$t('general')}</h2>
      <div class="text-sm">
        {#each shortcuts.general as shortcut}
          <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
            <div class="flex justify-self-end">
              {#each shortcut.key as key}
                <p class="mr-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                  {key}
                </p>
              {/each}
            </div>
            <p class="mb-1 mt-1 flex">{shortcut.action}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="p-4">
      <h2>{$t('actions')}</h2>
      <div class="text-sm">
        {#each shortcuts.actions as shortcut}
          <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
            <div class="flex justify-self-end">
              {#each shortcut.key as key}
                <p class="mr-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                  {key}
                </p>
              {/each}
            </div>
            <div class="flex items-center gap-2">
              <p class="mb-1 mt-1 flex">{shortcut.action}</p>
              {#if shortcut.info}
                <Icon path={mdiInformationOutline} title={shortcut.info} />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</FullScreenModal>
