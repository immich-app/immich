<script lang="ts">
  import FullScreenModal from '../full-screen-modal.svelte';
  import Button from '../../elements/buttons/button.svelte';
  import type { Color } from '$lib/components/elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';

  export let title = $t('confirm');
  export let prompt = 'Are you sure you want to do this?';
  export let confirmText = $t('confirm');
  export let confirmColor: Color = 'red';
  export let cancelText = $t('cancel');
  export let cancelColor: Color = 'secondary';
  export let hideCancelButton = false;
  export let disabled = false;
  export let width: 'wide' | 'narrow' = 'narrow';
  export let onCancel: () => void;
  export let onConfirm: () => void;

  let isConfirmButtonDisabled = false;

  const handleConfirm = () => {
    isConfirmButtonDisabled = true;
    onConfirm();
  };
</script>

<FullScreenModal {title} onClose={onCancel} {width}>
  <div class="text-md py-5 text-center">
    <slot name="prompt">
      <p>{prompt}</p>
    </slot>
  </div>

  <svelte:fragment slot="sticky-bottom">
    {#if !hideCancelButton}
      <Button color={cancelColor} fullwidth on:click={onCancel}>
        {cancelText}
      </Button>
    {/if}
    <Button color={confirmColor} fullwidth on:click={handleConfirm} disabled={disabled || isConfirmButtonDisabled}>
      {confirmText}
    </Button>
  </svelte:fragment>
</FullScreenModal>
