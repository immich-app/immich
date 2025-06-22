<script lang="ts">
  import { Button, HStack, Modal, ModalBody, ModalFooter, type Color } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    title?: string;
    prompt?: string;
    confirmText?: string;
    confirmColor?: Color;
    disabled?: boolean;
    size?: 'small' | 'medium';
    onClose: (confirmed: boolean) => void;
    promptSnippet?: Snippet;
  }

  let {
    title = $t('confirm'),
    prompt = $t('are_you_sure_to_do_this'),
    confirmText = $t('confirm'),
    confirmColor = 'danger',
    disabled = false,
    size = 'small',
    onClose,
    promptSnippet,
  }: Props = $props();

  const handleConfirm = () => {
    onClose(true);
  };
</script>

<Modal {title} onClose={() => onClose(false)} {size}>
  <ModalBody>
    {#if promptSnippet}{@render promptSnippet()}{:else}
      <p>{prompt}</p>
    {/if}
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose(false)}>
        {$t('cancel')}
      </Button>
      <Button shape="round" color={confirmColor} fullWidth onclick={handleConfirm} {disabled}>
        {confirmText}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
