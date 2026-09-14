<script lang="ts">
  import SupportedDatetimePanel from '$lib/components/admin-settings/SupportedDatetimePanel.svelte';
  import SupportedVariablesPanel from '$lib/components/admin-settings/SupportedVariablesPanel.svelte';
  import type { SystemConfigTemplateStorageOptionDto } from '@immich/sdk';
  import { BasicModal, Stack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    options: SystemConfigTemplateStorageOptionDto;
    onClose: () => void;
  };

  const { options, onClose }: Props = $props();
</script>

<BasicModal title={$t('variables')} size="giant" {onClose}>
  <Stack gap={4}>
    <SupportedDatetimePanel {options} />
    <SupportedVariablesPanel />
  </Stack>
</BasicModal>
