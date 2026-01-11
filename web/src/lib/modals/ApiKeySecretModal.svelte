<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { Button, HStack, Modal, ModalBody, ModalFooter, Text, Textarea } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    secret?: string;
    onClose: () => void;
  };

  let { secret = '', onClose }: Props = $props();
</script>

<Modal title={$t('api_key')} icon={mdiKeyVariant} {onClose} size="small">
  <ModalBody>
    <Text size="small" class="mb-4">{$t('api_key_description')}</Text>
    <Textarea bind:value={secret} readonly class="font-mono" />
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" onclick={() => copyToClipboard(secret)} fullWidth>{$t('copy_to_clipboard')}</Button>
      <Button shape="round" onclick={onClose} fullWidth>{$t('done')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
