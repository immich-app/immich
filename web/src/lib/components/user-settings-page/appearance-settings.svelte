<script lang="ts">
  import type { ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import SettingCombobox from '$lib/components/shared-components/settings/setting-combobox.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { fallbackLocale, locales } from '$lib/constants';
  import { sidebarSettings } from '$lib/stores/preferences.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { colorTheme, locale } from '$lib/stores/preferences.store';
  import { findLocale } from '$lib/utils';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

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

  const handleLocaleChange = (newLocale: string | undefined) => {
    $locale = newLocale;
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title="Theme selection"
          subtitle="Automatically set the theme to light or dark based on your browser's system preference"
          bind:checked={$colorTheme.system}
          on:toggle={handleToggleColorTheme}
        />
      </div>

      <div class="ml-4">
        <SettingSwitch
          title="Default Locale"
          subtitle="Format dates and numbers based on your browser locale"
          checked={$locale == undefined}
          on:toggle={handleToggleLocaleBrowser}
        >
          <p class="mt-2">{selectedDate}</p>
        </SettingSwitch>
      </div>
      {#if $locale !== undefined}
        <div class="ml-4">
          <SettingCombobox
            comboboxPlaceholder="Searching locales..."
            {selectedOption}
            options={getAllLanguages()}
            title="Custom Locale"
            subtitle="Format dates and numbers based on the language and the region"
            onSelect={(combobox) => handleLocaleChange(combobox?.value)}
          />
        </div>
      {/if}

      <div class="ml-4">
        <SettingSwitch
          title="Display original photos"
          subtitle="Prefer to display the original photo when viewing an asset rather than thumbnails when the original asset is web-compatible. This may result in slower photo display speeds."
          bind:checked={$alwaysLoadOriginalFile}
          on:toggle={() => ($alwaysLoadOriginalFile = !$alwaysLoadOriginalFile)}
        />
      </div>

      <div class="ml-4">
        <SettingSwitch
          title="People"
          subtitle="Display a link to People in the sidebar"
          bind:checked={$sidebarSettings.people}
        />
      </div>
      <div class="ml-4">
        <SettingSwitch
          title="Sharing"
          subtitle="Display a link to Sharing in the sidebar"
          bind:checked={$sidebarSettings.sharing}
        />
      </div>
    </div>
  </div>
</section>
