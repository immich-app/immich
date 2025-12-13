<script lang="ts">
  import SettingsLanguageSelector from '$lib/components/shared-components/settings/settings-language-selector.svelte';
  import { t } from 'svelte-i18n';
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_locale_description')}
  </p>

  <SettingsLanguageSelector />
</div>
