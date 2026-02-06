<script lang="ts">
  import type { ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import SettingCombobox from '$lib/components/shared-components/settings/setting-combobox.svelte';
  import SettingsLanguageSelector from '$lib/components/shared-components/settings/settings-language-selector.svelte';
  import { fallbackLocale, locales } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { locale, showDeleteModal } from '$lib/stores/preferences.store';
  import { findLocale } from '$lib/utils';
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

  const formatDateTime = (loc: string, date: Date) => {
    try {
      return new Intl.DateTimeFormat(loc, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  };

  let editedLocale = $derived(findLocale($locale).code);
  let selectedDate: string = $derived(formatDateTime(editedLocale, time));
  let selectedOption = $derived({
    value: findLocale(editedLocale).code || fallbackLocale.code,
    label: findLocale(editedLocale).name || fallbackLocale.name,
  });
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="sm:ms-8 flex flex-col gap-6">
      <Field label={$t('theme_selection')} description={$t('theme_selection_description')}>
        <Switch checked={themeManager.theme.system} onCheckedChange={(checked) => themeManager.setSystem(checked)} />
      </Field>

      <SettingsLanguageSelector showSettingDescription />

      <Field label={$t('default_locale')} description={$t('default_locale_description')}>
        <Switch checked={$locale == 'default'} onCheckedChange={handleToggleLocaleBrowser} />
        <Text size="small" class="mt-2 font-mono text-sm">{selectedDate}</Text>
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

      <Field label={$t('permanent_deletion_warning')} description={$t('permanent_deletion_warning_setting_description')}
        ><Switch bind:checked={$showDeleteModal} />
      </Field>
    </div>
  </div>
</section>
