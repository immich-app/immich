<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Combobox from '$lib/components/shared-components/combobox.svelte';
  import { defaultLang, langs } from '$lib/constants';
  import { lang } from '$lib/stores/preferences.store';
  import { getClosestAvailableLocale, langCodes } from '$lib/utils/i18n';
  import { Label, Text } from '@immich/ui';
  import { locale as i18nLocale, t } from 'svelte-i18n';

  interface Props {
    showSettingDescription?: boolean;
  }

  let { showSettingDescription = false }: Props = $props();

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

<div class="max-w-[300px]">
  {#if showSettingDescription}
    <div>
      <div class="flex h-6.5 place-items-center gap-1">
        <Label>{$t('language')}</Label>
      </div>

      <Text size="small" color="muted">{$t('language_setting_description')}</Text>
    </div>
  {/if}

  <Combobox
    label={$t('language')}
    hideLabel={true}
    selectedOption={langOptions.find(({ value }) => value === closestLanguage) || defaultLangOption}
    placeholder={$t('language')}
    onSelect={(event) => handleLanguageChange(event?.value)}
    options={langOptions}
  />
</div>
