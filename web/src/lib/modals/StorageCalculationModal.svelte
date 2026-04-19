<script lang="ts">
  import { Button, Heading, Icon, Modal, ModalBody } from '@immich/ui';
  import { mdiHarddisk } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal title=" " {onClose} size="medium">
  <ModalBody>
    <section class="text-center">
      <div class="mb-4 flex justify-center">
        <Icon icon={mdiHarddisk} class="text-primary" size="64" />
      </div>

      <Heading color="primary" tag="h1" class="mb-4 text-3xl font-bold tracking-wider">
        {$t('storage_calculation_notice_title')}
      </Heading>

      <div class="my-6 text-gray-800 dark:text-white">
        <p>
          {$t('storage_calculation_notice_info')}
        </p>
      </div>

      <Button shape="round" fullWidth color="secondary" variant="ghost" onclick={onClose}>
        {$t('close')}
      </Button>
    </section>
  </ModalBody>
</Modal>
