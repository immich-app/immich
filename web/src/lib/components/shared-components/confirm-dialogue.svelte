<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import Button from '../elements/buttons/button.svelte';
  import type { Color } from '$lib/components/elements/buttons/button.svelte';

  export let title = 'Confirm';
  export let prompt = 'Are you sure you want to do this?';
  export let confirmText = 'Confirm';
  export let confirmColor: Color = 'red';
  export let cancelText = 'Cancel';
  export let cancelColor: Color = 'primary';
  export let hideCancelButton = false;
  export let disabled = false;

  const dispatch = createEventDispatcher<{ cancel: void; confirm: void }>();

  let isConfirmButtonDisabled = false;

  const handleCancel = () => dispatch('cancel');
  const handleEscape = () => {
    if (!isConfirmButtonDisabled) {
      dispatch('cancel');
    }
  };

  const handleConfirm = () => {
    isConfirmButtonDisabled = true;
    dispatch('confirm');
  };
</script>

<FullScreenModal on:clickOutside={handleCancel} on:escape={() => handleEscape()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <h1 class="pb-2 text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">
        {title}
      </h1>
    </div>
    <div>
      <div class="text-md px-4 py-5 text-center">
        <slot name="prompt">
          <p>{prompt}</p>
        </slot>
      </div>

      <div class="mt-4 flex w-full gap-4 px-4">
        {#if !hideCancelButton}
          <Button color={cancelColor} fullwidth on:click={handleCancel}>
            {cancelText}
          </Button>
        {/if}
        <Button color={confirmColor} fullwidth on:click={handleConfirm} disabled={disabled || isConfirmButtonDisabled}>
          {confirmText}
        </Button>
      </div>
    </div>
  </div>
</FullScreenModal>
