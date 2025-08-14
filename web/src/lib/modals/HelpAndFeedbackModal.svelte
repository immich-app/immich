<script lang="ts">
  import { discordPath, discordViewBox } from '$lib/assets/svg-paths';
  import Icon from '$lib/components/elements/icon.svelte';
  import { type ServerAboutResponseDto } from '@immich/sdk';
  import { Modal, ModalBody } from '@immich/ui';
  import { mdiBugOutline, mdiFaceAgent, mdiGit, mdiGithub, mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
    info: ServerAboutResponseDto;
  }

  let { onClose, info }: Props = $props();
</script>

<Modal title={$t('support_and_feedback')} {onClose} size="small">
  <ModalBody>
    
  </ModalBody>
</Modal>
