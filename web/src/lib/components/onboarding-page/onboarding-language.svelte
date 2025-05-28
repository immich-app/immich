<script lang="ts">
  import SettingCombobox from '$lib/components/shared-components/settings/setting-combobox.svelte';
  import { defaultLang, fallbackLocale, langs, locales } from '$lib/constants';
  import { getClosestAvailableLocale, langCodes } from '$lib/utils/i18n';
  import { locale as i18nLocale, t } from 'svelte-i18n';
  import { invalidateAll } from '$app/navigation';
  import { lang } from '$lib/stores/preferences.store';
  import { Select } from '@immich/ui';

  export async function save() {}

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

  let closestLanguage = $derived(getClosestAvailableLocale([$lang], langCodes));
</script>

<div>
  <div>
    <p class="pb-6 font-light">{$t('onboarding_locale_description')}</p>
  </div>

  <div class="ms-4">
    <Select
      data={langOptions}
      placeholder={$t('language')}
      onChange={(event) => handleLanguageChange(event.value)}
      value={langOptions.find(({ value }) => value === closestLanguage) || defaultLangOption}
    ></Select>
  </div>
</div>
