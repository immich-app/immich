<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    secret?: string;
    onClose: () => void;
  }

  let { secret = '', onClose }: Props = $props();
</script>

<Modal title={$t('api_key')} icon={mdiKeyVariant} {onClose} size="small">
  <ModalBody>
    <div class="text-primary">
      <p class="text-sm dark:text-immich-dark-fg">
        {$t('api_key_description')}
      </p>
    </div>

    <div class="my-4 flex flex-col gap-2">
      <!-- <label class="immich-form-label" for="secret">{ $t("api_key") }</label> -->
      <textarea class="immich-form-input" id="secret" name="secret" readonly={true} value={secret}></textarea>
    </div>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" onclick={() => copyToClipboard(secret)} fullWidth>{$t('copy_to_clipboard')}</Button>
      <Button shape="round" onclick={onClose} fullWidth>{$t('done')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
