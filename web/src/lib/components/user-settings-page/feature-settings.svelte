<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { updateMyPreferences } from '@immich/sdk';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';

  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { preferences } from '$lib/stores/user.store';
  import Button from '../elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';

  let memoriesEnabled = $preferences?.memories?.enabled ?? true;
  let folderEnabled = $preferences?.folders?.enabled ?? false;
  let peopleEnabled = $preferences?.people?.enabled ?? false;
  let ratingEnabled = $preferences?.ratings?.enabled ?? false;
  let tagEnabled = $preferences?.tags?.enabled ?? false;

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          folders: { enabled: folderEnabled },
          memories: { enabled: memoriesEnabled },
          people: { enabled: peopleEnabled },
          ratings: { enabled: ratingEnabled },
          tags: { enabled: tagEnabled },
        },
      });

      $preferences.folders.enabled = data.folders.enabled;
      $preferences.memories.enabled = data.memories.enabled;
      $preferences.people.enabled = data.people.enabled;
      $preferences.ratings.enabled = data.ratings.enabled;
      $preferences.tags.enabled = data.tags.enabled;

      notificationController.show({ message: $t('saved_settings'), type: NotificationType.Info });
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingAccordion key="folders" title={$t('folders')} subtitle={$t('folders_feature_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={folderEnabled} />
          </div>
          <div class="ml-4 mt-6">
            <SettingSwitch
              title={$t('sidebar')}
              subtitle={$t('sidebar_display_description')}
              bind:checked={folderEnabled}
            />
          </div>
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
          <div class="ml-4 mt-6">
            <SettingSwitch
              title={$t('sidebar')}
              subtitle={$t('sidebar_display_description')}
              bind:checked={tagEnabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion key="rating" title={$t('rating')} subtitle={$t('rating_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={ratingEnabled} />
          </div>
        </SettingAccordion>

        <SettingAccordion key="tags" title={$t('tags')} subtitle={$t('tag_feature_description')}>
          <div class="ml-4 mt-6">
            <SettingSwitch title={$t('enable')} bind:checked={tagEnabled} />
          </div>
          <div class="ml-4 mt-6">
            <SettingSwitch
              title={$t('sidebar')}
              subtitle={$t('sidebar_display_description')}
              bind:checked={tagEnabled}
            />
          </div>
        </SettingAccordion>

        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
