<script lang="ts">
  import type { ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import SettingCombobox from '$lib/components/shared-components/settings/setting-combobox.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { defaultLang, fallbackLocale, langs, locales } from '$lib/constants';
  import {
    alwaysLoadOriginalFile,
    colorTheme,
    lang,
    locale,
    loopVideo,
    playVideoThumbnailOnHover,
    showDeleteModal,
  } from '$lib/stores/preferences.store';
  import { findLocale } from '$lib/utils';
  import { getClosestAvailableLocale, langCodes } from '$lib/utils/i18n';
  import { onMount } from 'svelte';
  import { locale as i18nLocale, t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { invalidateAll } from '$app/navigation';

  let time = new Date();

  $: formattedDate = time.toLocaleString(editedLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  $: timePortion = time.toLocaleString(editedLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  $: selectedDate = `${formattedDate} ${timePortion}`;
  $: editedLocale = findLocale($locale).code;
  $: selectedOption = {
    value: findLocale(editedLocale).code || fallbackLocale.code,
    label: findLocale(editedLocale).name || fallbackLocale.name,
  };
  $: closestLanguage = getClosestAvailableLocale([$lang], langCodes);

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

  const handleToggleColorTheme = () => {
    $colorTheme.system = !$colorTheme.system;
  };

  const handleToggleLocaleBrowser = () => {
    $locale = $locale ? undefined : fallbackLocale.code;
  };

  const langOptions = langs
    .map((lang) => ({ label: lang.name, value: lang.code }))
    .sort((a, b) => {
      if (b.label.startsWith('Development')) {
        return -1;
      }
      return a.label.localeCompare(b.label);
    });
  const defaultLangOption = { label: defaultLang.name, value: defaultLang.code };

  const handleLanguageChange = async (newLang: string | undefined) => {
    if (newLang) {
      $lang = newLang;
      await i18nLocale.set(newLang);
      await invalidateAll();
    }
  };

  const handleLocaleChange = (newLocale: string | undefined) => {
    if (newLocale) {
      $locale = newLocale;
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title={$t('theme_selection')}
          subtitle={$t('theme_selection_description')}
          bind:checked={$colorTheme.system}
          onToggle={handleToggleColorTheme}
        />
      </div>

      <div class="ml-4">
        <SettingCombobox
          comboboxPlaceholder={$t('language')}
          selectedOption={langOptions.find(({ value }) => value === closestLanguage) || defaultLangOption}
          options={langOptions}
          title={$t('language')}
          subtitle={$t('language_setting_description')}
          onSelect={(combobox) => handleLanguageChange(combobox?.value)}
        />
      </div>

      <div class="ml-4">
        <SettingSwitch
          title={$t('default_locale')}
          subtitle={$t('default_locale_description')}
          checked={$locale == undefined}
          onToggle={handleToggleLocaleBrowser}
        >
          <p class="mt-2 dark:text-gray-400">{selectedDate}</p>
        </SettingSwitch>
      </div>
      {#if $locale !== undefined}
        <div class="ml-4">
          <SettingCombobox
            comboboxPlaceholder={$t('searching_locales')}
            {selectedOption}
            options={getAllLanguages()}
            title={$t('custom_locale')}
            subtitle={$t('custom_locale_description')}
            onSelect={(combobox) => handleLocaleChange(combobox?.value)}
          />
        </div>
      {/if}

      <div class="ml-4">
        <SettingSwitch
          title={$t('display_original_photos')}
          subtitle={$t('display_original_photos_setting_description')}
          bind:checked={$alwaysLoadOriginalFile}
          onToggle={() => ($alwaysLoadOriginalFile = !$alwaysLoadOriginalFile)}
        />
      </div>
      <div class="ml-4">
        <SettingSwitch
          title={$t('video_hover_setting')}
          subtitle={$t('video_hover_setting_description')}
          bind:checked={$playVideoThumbnailOnHover}
          onToggle={() => ($playVideoThumbnailOnHover = !$playVideoThumbnailOnHover)}
        />
      </div>
      <div class="ml-4">
        <SettingSwitch
          title={$t('loop_videos')}
          subtitle={$t('loop_videos_description')}
          bind:checked={$loopVideo}
          onToggle={() => ($loopVideo = !$loopVideo)}
        />
      </div>

      <div class="ml-4">
        <SettingSwitch
          title={$t('permanent_deletion_warning')}
          subtitle={$t('permanent_deletion_warning_setting_description')}
          bind:checked={$showDeleteModal}
        />
      </div>
    </div>
  </div>
</section>
