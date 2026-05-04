<script lang="ts">
  import Logo from '$lib/components/shared-components/Logo.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { CardTitle, CloseButton, Icon, Modal, ModalBody, ModalHeader } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';
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

  interface Props {
    onClose: () => void;
    shortcuts?: Shortcuts;
  }

  let {
    onClose,
    shortcuts = {
      general: [
        { key: ['←', '→'], action: $t('previous_or_next_photo') },
        { key: ['D', 'd'], action: $t('previous_or_next_day') },
        { key: ['M', 'm'], action: $t('previous_or_next_month') },
        { key: ['Y', 'y'], action: $t('previous_or_next_year') },
        { key: ['g'], action: $t('navigate_to_time') },
        { key: ['x'], action: $t('select') },
        { key: ['Esc'], action: $t('back_close_deselect') },
        { key: ['Ctrl', 'k'], action: $t('shortcut_open_global_search') },
        { key: ['Ctrl', '/'], action: $t('shortcut_cycle_search_mode') },
        { key: ['Ctrl', '⇧', 'k'], action: $t('open_the_search_filters') },
      ],
      actions: [
        { key: ['f'], action: $t('favorite_or_unfavorite_photo') },
        { key: ['i'], action: $t('show_or_hide_info') },
        { key: ['s'], action: $t('stack_selected_photos') },
        { key: ['l'], action: $t('add_to_album') },
        { key: ['t'], action: $t('tag_assets') },
        { key: ['p'], action: $t('tag_people') },
        { key: ['⇧', 'a'], action: $t('archive_or_unarchive_photo') },
        { key: ['⇧', 'd'], action: $t('download') },
        { key: ['Space'], action: $t('play_or_pause_video') },
        { key: ['Del'], action: $t('trash_delete_asset'), info: $t('shift_to_permanent_delete') },
        ...(authManager.authenticated && authManager.preferences.ratings.enabled
          ? [{ key: ['1-5'], action: $t('rate_asset'), info: $t('zero_to_clear_rating') }]
          : []),
      ],
    },
  }: Props = $props();
</script>

<Modal title={$t('keyboard_shortcuts')} size="medium" {onClose}>
  <ModalHeader>
    <div class="flex items-center justify-between gap-2">
      <Logo variant="icon" size="tiny" />
      <CardTitle tag="p" class="grow text-lg font-semibold text-dark/90 dark:text-white/90">
        {$t('keyboard_shortcuts')}
      </CardTitle>
      <CloseButton class="-me-2" onclick={onClose} />
    </div>
  </ModalHeader>
  <ModalBody>
    <div class="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
      {#if shortcuts.general.length > 0}
        <div class="p-4">
          <h2>{$t('general')}</h2>
          <div class="text-sm">
            {#each shortcuts.general as shortcut (shortcut.key.join('-'))}
              <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
                <div class="flex justify-self-end">
                  {#each shortcut.key as key (key)}
                    <p
                      class="me-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2"
                    >
                      {key}
                    </p>
                  {/each}
                </div>
                <p class="mb-1 mt-1 flex">{shortcut.action}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      {#if shortcuts.actions.length > 0}
        <div class="p-4">
          <h2>{$t('actions')}</h2>
          <div class="text-sm">
            {#each shortcuts.actions as shortcut (shortcut.key.join('-'))}
              <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
                <div class="flex justify-self-end">
                  {#each shortcut.key as key (key)}
                    <p
                      class="me-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2"
                    >
                      {key}
                    </p>
                  {/each}
                </div>
                <div class="flex items-center gap-2">
                  <p class="mb-1 mt-1 flex">{shortcut.action}</p>
                  {#if shortcut.info}
                    <Icon icon={mdiInformationOutline} title={shortcut.info} />
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      <div class="p-4 md:col-span-2">
        <h2>{$t('cmdk_shortcut_scope_heading')}</h2>
        <div class="text-sm">
          <div class="grid grid-cols-[30%_70%] items-center gap-4 pt-4 text-sm">
            <div class="flex justify-self-end">
              <p class="me-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                @
              </p>
            </div>
            <p class="mb-1 mt-1 flex">{$t('cmdk_shortcut_scope_people')}</p>

            <div class="flex justify-self-end">
              <p class="me-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                #
              </p>
            </div>
            <p class="mb-1 mt-1 flex">{$t('cmdk_shortcut_scope_tags')}</p>

            <div class="flex justify-self-end">
              <p class="me-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                /
              </p>
            </div>
            <p class="mb-1 mt-1 flex">{$t('cmdk_shortcut_scope_collections')}</p>

            <div class="flex justify-self-end">
              <p class="me-1 flex items-center justify-center justify-self-end rounded-lg bg-immich-primary/25 p-2">
                &gt;
              </p>
            </div>
            <p class="mb-1 mt-1 flex">{$t('cmdk_shortcut_scope_nav')}</p>
          </div>
        </div>
      </div>
    </div>
  </ModalBody>
</Modal>
