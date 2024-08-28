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

  let memoriesEnabled = $preferences?.metadata?.memory?.enabled ?? true;
  let folderEnabled = $preferences?.metadata?.folder?.enabled ?? false;
  let peopleEnabled = $preferences?.metadata?.people?.enabled ?? false;
  let ratingEnabled = $preferences?.metadata?.rating?.enabled ?? false;
  let tagEnabled = $preferences?.metadata?.tag?.enabled ?? false;

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          metadata: {
            folder: { enabled: folderEnabled },
            memory: { enabled: memoriesEnabled },
            people: { enabled: peopleEnabled },
            rating: { enabled: ratingEnabled },
            tag: { enabled: tagEnabled },
          },
        },
      });

      $preferences.metadata.folder.enabled = data.metadata.folder.enabled;
      $preferences.metadata.memory.enabled = data.metadata.memory.enabled;
      $preferences.metadata.people.enabled = data.metadata.people.enabled;
      $preferences.metadata.rating.enabled = data.metadata.rating.enabled;
      $preferences.metadata.tag.enabled = data.metadata.tag.enabled;

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
        <div class="ml-4">
          <SettingSwitch
            title={$t('folders')}
            subtitle={$t('folders_sidebar_description')}
            bind:checked={folderEnabled}
          />
        </div>

        <div class="ml-4 mt-4">
          <SettingSwitch
            title={$t('time_based_memories')}
            subtitle={$t('photos_from_previous_years')}
            bind:checked={memoriesEnabled}
          />
        </div>

        <div class="ml-4 mt-4">
          <SettingSwitch
            title={$t('people')}
            subtitle={$t('people_sidebar_description')}
            bind:checked={peopleEnabled}
          />
        </div>

        <div class="ml-4 mt-4">
          <SettingSwitch title={$t('rating')} subtitle={$t('rating_description')} bind:checked={ratingEnabled} />
        </div>

        <div class="ml-4 mt-4">
          <SettingSwitch title={$t('tags')} subtitle={$t('tag_view_description')} bind:checked={tagEnabled} />
        </div>
        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
