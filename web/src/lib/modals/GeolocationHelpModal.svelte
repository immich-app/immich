<script lang="ts">
  import { BasicModal, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  const { onClose }: Props = $props();
</script>

<BasicModal title={$t('about')} {onClose}>
  <Text>{$t('geolocation_instruction_location')}</Text>
</BasicModal>
