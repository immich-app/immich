<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { type ServerAboutResponseDto, type ServerVersionHistoryResponseDto } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { mdiAlert } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    info: ServerAboutResponseDto;
    versions: ServerVersionHistoryResponseDto[];
  }

  let { onClose, info, versions }: Props = $props();
</script>

<Modal title={$t('about')} {onClose}>
</Modal>
