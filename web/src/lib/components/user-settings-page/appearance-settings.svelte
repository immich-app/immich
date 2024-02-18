<script lang="ts">
  import { fade } from 'svelte/transition';
  import { colorTheme, locale } from '../../stores/preferences.store';
  import Locales from '$lib/assets/locales.json';
  import type { ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { onMount } from 'svelte';
  import { findLocale } from '$lib/utils';
  import { fallbackLocale } from '$lib/constants';
  import SettingCombobox from '$lib/components/shared-components/settings/setting-combobox.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';

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
    const testNumber = 10;
    // test locales supported by the browser
    return Locales.map((locale) => ({
      label: locale.name,
      value: locale.code,
    })).filter((locale) => {
      try {
        if (testNumber.toLocaleString(locale.value)) {
          return locale;
        }
      } catch {
        // do nothing
      }
    });
  };

  const handleToggleColorTheme = () => {
    $colorTheme.system = !$colorTheme.system;
  };

  const handleToggleLocaleBrowser = () => {
    $locale = $locale ? undefined : fallbackLocale.code;
  };

  const handleLocaleChange = (newLocale: string) => {
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
            on:select={({ detail }) => handleLocaleChange(detail.value)}
          />
        </div>
      {/if}
    </div>
  </div>
</section>
