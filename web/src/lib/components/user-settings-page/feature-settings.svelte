<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { updateMyPreferences } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';

  // Folders
  let foldersEnabled = $state($preferences?.folders?.enabled ?? false);
  let foldersSidebar = $state($preferences?.folders?.sidebarWeb ?? false);

  // Memories
  let memoriesEnabled = $state($preferences?.memories?.enabled ?? true);

  // People
  let peopleEnabled = $state($preferences?.people?.enabled ?? false);
  let peopleSidebar = $state($preferences?.people?.sidebarWeb ?? false);

  // Ratings
  let ratingsEnabled = $state($preferences?.ratings?.enabled ?? false);

  // Shared links
  let sharedLinksEnabled = $state($preferences?.sharedLinks?.enabled ?? true);
  let sharedLinkSidebar = $state($preferences?.sharedLinks?.sidebarWeb ?? false);

  // Tags
  let tagsEnabled = $state($preferences?.tags?.enabled ?? false);
  let tagsSidebar = $state($preferences?.tags?.sidebarWeb ?? false);

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          folders: { enabled: foldersEnabled, sidebarWeb: foldersSidebar },
          memories: { enabled: memoriesEnabled },
          people: { enabled: peopleEnabled, sidebarWeb: peopleSidebar },
          ratings: { enabled: ratingsEnabled },
          sharedLinks: { enabled: sharedLinksEnabled, sidebarWeb: sharedLinkSidebar },
          tags: { enabled: tagsEnabled, sidebarWeb: tagsSidebar },
        },
      });

      $preferences = { ...data };

      notificationController.show({ message: $t('saved_settings'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ml-4 mt-4 flex flex-col">
        <SettingAccordion key="folders" title={$t('folders')} subtitle={$t('folders_feature_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={foldersEnabled} />
          </div>

          {#if foldersEnabled}
            <div class="ml-4 mt-6">
              <SettingSwitch
                title={$t('sidebar')}
                subtitle={$t('sidebar_display_description')}
                bind:checked={foldersSidebar}
              />
            </div>
          {/if}
        </SettingAccordion>

        <SettingAccordion key="memories" title={$t('time_based_memories')} subtitle={$t('photos_from_previous_years')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={memoriesEnabled} />
          </div>
        </SettingAccordion>

        <SettingAccordion key="people" title={$t('people')} subtitle={$t('people_feature_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={peopleEnabled} />
          </div>

          {#if peopleEnabled}
            <div class="ml-4 mt-6">
              <SettingSwitch
                title={$t('sidebar')}
                subtitle={$t('sidebar_display_description')}
                bind:checked={peopleSidebar}
              />
            </div>
          {/if}
        </SettingAccordion>

        <SettingAccordion key="rating" title={$t('rating')} subtitle={$t('rating_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={ratingsEnabled} />
          </div>
        </SettingAccordion>

        <SettingAccordion key="shared-links" title={$t('shared_links')} subtitle={$t('shared_links_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={sharedLinksEnabled} />
          </div>
          {#if sharedLinksEnabled}
            <div class="ml-4 mt-6">
              <SettingSwitch
                title={$t('sidebar')}
                subtitle={$t('sidebar_display_description')}
                bind:checked={sharedLinkSidebar}
              />
            </div>
          {/if}
        </SettingAccordion>

        <SettingAccordion key="tags" title={$t('tags')} subtitle={$t('tag_feature_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={tagsEnabled} />
          </div>
          {#if tagsEnabled}
            <div class="ml-4 mt-6">
              <SettingSwitch
                title={$t('sidebar')}
                subtitle={$t('sidebar_display_description')}
                bind:checked={tagsSidebar}
              />
            </div>
          {/if}
        </SettingAccordion>

        <div class="flex justify-end">
          <Button shape="round" type="submit" size="small" onclick={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
