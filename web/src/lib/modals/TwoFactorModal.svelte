<script lang="ts">
  import { Button, Heading, Icon, Modal, ModalBody } from '@immich/ui';
  import { mdiShieldLock } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const openConfigPage = () => {
    window.open('https://login.pixelunion.eu/realms/pixelunion/account', '_blank', 'noopener,noreferrer');
  };
</script>

<Modal title=" " {onClose} size="medium">
  <ModalBody>
    <section class="text-center">
      <div class="flex justify-center mb-4">
        <Icon icon={mdiShieldLock} class="text-primary" size="64" />
      </div>

      <Heading color="primary" tag="h1" class="text-3xl font-bold tracking-wider mb-4">
        {$t('two_factor_panel_title')}
      </Heading>

      <div class="text-gray-800 dark:text-white my-6">
        <p>
          {$t('two_factor_panel_info')}
        </p>
      </div>

      <Button shape="round" fullWidth onclick={openConfigPage}>
        {$t('two_factor_button_configure')}
      </Button>

      <div class="mt-4">
        <Button shape="round" fullWidth color="secondary" variant="ghost" onclick={onClose}>
          {$t('close')}
        </Button>
      </div>
    </section>
  </ModalBody>
</Modal>
