<script lang="ts">
  import Combobox from '$lib/components/shared-components/combobox.svelte';

  import { invalidateAll } from '$app/navigation';
  import { defaultLang, langs } from '$lib/constants';
  import { lang } from '$lib/stores/preferences.store';
  import { getClosestAvailableLocale, langCodes } from '$lib/utils/i18n';
  import { locale as i18nLocale, t } from 'svelte-i18n';

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

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_locale_description')}
  </p>

  <Combobox
    label={$t('language')}
    hideLabel={true}
    selectedOption={langOptions.find(({ value }) => value === closestLanguage) || defaultLangOption}
    placeholder={$t('language')}
    onSelect={(event) => handleLanguageChange(event?.value)}
    options={langOptions}
  />
</div>
