<script lang="ts">
  import { Button, Modal, ModalBody, ModalFooter, type Color } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    title?: string;
    prompt?: string;
    confirmText?: string;
    confirmColor?: Color;
    cancelText?: string;
    cancelColor?: Color;
    hideCancelButton?: boolean;
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
    cancelText = $t('cancel'),
    cancelColor = 'secondary',
    hideCancelButton = false,
    disabled = false,
    size = 'small',
    onClose,
    promptSnippet,
  }: Props = $props();

  const handleConfirm = () => {
    onClose(true);
  };
</script>

<Modal {title} onClose={() => onClose(false)} {size} class="bg-light text-dark">
  <ModalBody>
    {#if promptSnippet}{@render promptSnippet()}{:else}
      <p>{prompt}</p>
    {/if}
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-3 w-full my-3">
      {#if !hideCancelButton}
        <Button shape="round" color={cancelColor} fullWidth onclick={() => onClose(false)}>
          {cancelText}
        </Button>
      {/if}
      <Button shape="round" color={confirmColor} fullWidth onclick={handleConfirm} {disabled}>
        {confirmText}
      </Button>
    </div>
  </ModalFooter>
</Modal>
