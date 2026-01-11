<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetOrder, updateMyPreferences } from '@immich/sdk';
  import { Button, Field, NumberInput, Switch, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  // Albums
  let defaultAssetOrder = $state($preferences?.albums?.defaultAssetOrder ?? AssetOrder.Desc);

  // Folders
  let foldersEnabled = $state($preferences?.folders?.enabled ?? false);
  let foldersSidebar = $state($preferences?.folders?.sidebarWeb ?? false);

  // Memories
  let memoriesEnabled = $state($preferences?.memories?.enabled ?? true);
  let memoriesDuration = $state($preferences?.memories?.duration ?? 5);

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

  // Cast
  let gCastEnabled = $state($preferences?.cast?.gCastEnabled ?? false);

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          albums: { defaultAssetOrder },
          folders: { enabled: foldersEnabled, sidebarWeb: foldersSidebar },
          memories: { enabled: memoriesEnabled, duration: memoriesDuration },
          people: { enabled: peopleEnabled, sidebarWeb: peopleSidebar },
          ratings: { enabled: ratingsEnabled },
          sharedLinks: { enabled: sharedLinksEnabled, sidebarWeb: sharedLinkSidebar },
          tags: { enabled: tagsEnabled, sidebarWeb: tagsSidebar },
          cast: { gCastEnabled },
        },
      });

      $preferences = { ...data };

      toastManager.success($t('saved_settings'));
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
      <div class="ms-4 mt-4 flex flex-col">
        <SettingAccordion key="albums" title={$t('albums')} subtitle={$t('albums_feature_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <SettingSelect
              label={$t('albums_default_sort_order')}
              desc={$t('albums_default_sort_order_description')}
              options={[
                { value: AssetOrder.Asc, text: $t('oldest_first') },
                { value: AssetOrder.Desc, text: $t('newest_first') },
              ]}
              bind:value={defaultAssetOrder}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion key="folders" title={$t('folders')} subtitle={$t('folders_feature_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('enable')}>
              <Switch bind:checked={foldersEnabled} />
            </Field>

            {#if foldersEnabled}
              <Field label={$t('sidebar')} description={$t('sidebar_display_description')}>
                <Switch bind:checked={foldersSidebar} />
              </Field>
            {/if}
          </div>
        </SettingAccordion>

        <SettingAccordion key="memories" title={$t('time_based_memories')} subtitle={$t('photos_from_previous_years')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('enable')}>
              <Switch bind:checked={memoriesEnabled} />
            </Field>

            <Field label={$t('duration')} description={$t('time_based_memories_duration')}>
              <NumberInput bind:value={memoriesDuration} />
            </Field>
          </div>
        </SettingAccordion>

        <SettingAccordion key="people" title={$t('people')} subtitle={$t('people_feature_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('enable')}>
              <Switch bind:checked={peopleEnabled} />
            </Field>

            {#if peopleEnabled}
              <Field label={$t('sidebar')} description={$t('sidebar_display_description')}>
                <Switch bind:checked={peopleSidebar} />
              </Field>
            {/if}
          </div>
        </SettingAccordion>

        <SettingAccordion key="rating" title={$t('rating')} subtitle={$t('rating_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('enable')}>
              <Switch bind:checked={ratingsEnabled} />
            </Field>
          </div>
        </SettingAccordion>

        <SettingAccordion key="shared-links" title={$t('shared_links')} subtitle={$t('shared_links_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('enable')}>
              <Switch bind:checked={sharedLinksEnabled} />
            </Field>

            {#if sharedLinksEnabled}
              <Field label={$t('sidebar')} description={$t('sidebar_display_description')}>
                <Switch bind:checked={sharedLinkSidebar} />
              </Field>
            {/if}
          </div>
        </SettingAccordion>

        <SettingAccordion key="tags" title={$t('tags')} subtitle={$t('tag_feature_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('enable')}>
              <Switch bind:checked={tagsEnabled} />
            </Field>

            {#if tagsEnabled}
              <Field label={$t('sidebar')} description={$t('sidebar_display_description')}>
                <Switch bind:checked={tagsSidebar} />
              </Field>
            {/if}
          </div>
        </SettingAccordion>

        <SettingAccordion key="cast" title={$t('cast')} subtitle={$t('cast_description')}>
          <div class="ms-4 mt-6 flex flex-col gap-4">
            <Field label={$t('gcast_enabled')} description={$t('gcast_enabled_description')}>
              <Switch bind:checked={gCastEnabled} />
            </Field>
          </div>
        </SettingAccordion>

        <div class="flex justify-end">
          <Button shape="round" type="submit" size="small" onclick={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
