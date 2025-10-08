<script lang="ts">
  import AppDownloadModal from '$lib/modals/AppDownloadModal.svelte';
  import ObtainiumConfigModal from '$lib/modals/ObtainiumConfigModal.svelte';
  import { Button, HStack, modalManager } from '@immich/ui';
  import { mdiCellphoneArrowDownVariant, mdiLinkEdit } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<HStack wrap>
  <Button
    size="large"
    shape="semi-round"
    onclick={() => modalManager.show(ObtainiumConfigModal, {})}
    leadingIcon={mdiLinkEdit}
  >
    {$t('obtainium_configurator')}</Button
  >
  <Button
    size="large"
    shape="semi-round"
    onclick={() => modalManager.show(AppDownloadModal, {})}
    leadingIcon={mdiCellphoneArrowDownVariant}
  >
    {$t('app_download_links')}</Button
  >
</HStack>
<p>{$t('mobile_app_download_onboarding_note')}</p>
