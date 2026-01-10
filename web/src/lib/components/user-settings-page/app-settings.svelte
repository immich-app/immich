<script lang="ts">
  import type { ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import SettingCombobox from '$lib/components/shared-components/settings/setting-combobox.svelte';
  import SettingsLanguageSelector from '$lib/components/shared-components/settings/settings-language-selector.svelte';
  import { fallbackLocale, locales } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import {
    alwaysLoadOriginalFile,
    alwaysLoadOriginalVideo,
    autoPlayVideo,
    locale,
    loopVideo,
    playVideoThumbnailOnHover,
    showDeleteModal,
  } from '$lib/stores/preferences.store';
  import { createDateFormatter, findLocale } from '$lib/utils';
  import { Field, Switch, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let time = $state(new Date());

  onMount(() => {
    const interval = setInterval(() => {
      time = new Date();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });

  const getAllLanguages = (): ComboBoxOption[] => {
    return locales
      .filter(({ code }) => Intl.NumberFormat.supportedLocalesOf(code).length > 0)
      .map((locale) => ({
        label: locale.name,
        value: locale.code,
      }));
  };

  const handleToggleLocaleBrowser = () => {
    $locale = $locale === 'default' ? fallbackLocale.code : 'default';
  };

  const handleLocaleChange = (newLocale: string | undefined) => {
    if (newLocale) {
      $locale = newLocale;
    }
  };
  let editedLocale = $derived(findLocale($locale).code);
  let selectedDate: string = $derived(createDateFormatter(editedLocale).formatDateTime(time));
  let selectedOption = $derived({
    value: findLocale(editedLocale).code || fallbackLocale.code,
    label: findLocale(editedLocale).name || fallbackLocale.name,
  });
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ms-8 mt-4 flex flex-col gap-4">
      <Field label={$t('theme_selection')} description={$t('theme_selection_description')}>
        <Switch checked={themeManager.theme.system} onCheckedChange={(checked) => themeManager.setSystem(checked)} />
      </Field>

      <SettingsLanguageSelector showSettingDescription />

      <Field label={$t('default_locale')} description={$t('default_locale_description')}>
        <Switch checked={$locale == 'default'} onCheckedChange={handleToggleLocaleBrowser} />
        <Text size="small" class="mt-2">{selectedDate}</Text>
      </Field>

      {#if $locale !== 'default'}
        <SettingCombobox
          comboboxPlaceholder={$t('searching_locales')}
          {selectedOption}
          options={getAllLanguages()}
          title={$t('custom_locale')}
          subtitle={$t('custom_locale_description')}
          onSelect={(combobox) => handleLocaleChange(combobox?.value)}
        />
      {/if}

      <Field label={$t('display_original_photos')} description={$t('display_original_photos_setting_description')}>
        <Switch bind:checked={$alwaysLoadOriginalFile} />
      </Field>

      <Field label={$t('video_hover_setting')} description={$t('video_hover_setting_description')}>
        <Switch bind:checked={$playVideoThumbnailOnHover} />
      </Field>

      <Field
        label={$t('setting_video_viewer_auto_play_title')}
        description={$t('setting_video_viewer_auto_play_subtitle')}
      >
        <Switch bind:checked={$autoPlayVideo} />
      </Field>

      <Field label={$t('loop_videos')} description={$t('loop_videos_description')}>
        <Switch bind:checked={$loopVideo} />
      </Field>

      <Field label={$t('play_original_video')} description={$t('play_original_video_setting_description')}>
        <Switch bind:checked={$alwaysLoadOriginalVideo} />
      </Field>

      <Field label={$t('permanent_deletion_warning')} description={$t('permanent_deletion_warning_setting_description')}
        ><Switch bind:checked={$showDeleteModal} />
      </Field>
    </div>
  </div>
</section>
