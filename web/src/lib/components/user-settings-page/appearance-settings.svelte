<script lang="ts">
  import { fade } from 'svelte/transition';
  import { colorTheme, locale } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import Locales from '$lib/assets/locales.json';
  import SettingCombobox from '../admin-page/settings/setting-combobox.svelte';
  import type { ComboBoxOption } from '../shared-components/combobox.svelte';
  import { onMount } from 'svelte';
  import { findLocale } from '$lib/utils';

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
    value: findLocale(editedLocale).code,
    label: findLocale(editedLocale).name,
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
    return Locales.map((locale) => ({
      label: locale.name,
      value: locale.code,
    }));
  };

  const handleToggle = () => {
    $colorTheme.system = !$colorTheme.system;
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
          on:toggle={handleToggle}
        />
      </div>
      <div class="ml-4">
        <SettingCombobox
          comboboxPlaceholder="Searching locales..."
          {selectedOption}
          options={getAllLanguages()}
          title="Locale"
          subtitle="Format dates and numbers based on your language and your region"
          on:select={({ detail }) => handleLocaleChange(detail.value)}
        >
          <p class="mt-2">{selectedDate}</p>
        </SettingCombobox>
      </div>
    </div>
  </div>
</section>
