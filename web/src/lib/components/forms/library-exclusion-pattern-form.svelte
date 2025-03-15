<script lang="ts">
  import { Button } from '@immich/ui';
  import { mdiFolderRemove } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  interface Props {
    exclusionPattern: string;
    exclusionPatterns?: string[];
    isEditing?: boolean;
    submitText?: string;
    onCancel: () => void;
    onSubmit: (exclusionPattern: string) => void;
    onDelete?: () => void;
  }

  let {
    exclusionPattern = $bindable(),
    exclusionPatterns = $bindable([]),
    isEditing = false,
    submitText = $t('submit'),
    onCancel,
    onSubmit,
    onDelete,
  }: Props = $props();

  onMount(() => {
    if (isEditing) {
      exclusionPatterns = exclusionPatterns.filter((pattern) => pattern !== exclusionPattern);
    }
  });

  let isDuplicate = $derived(exclusionPattern !== null && exclusionPatterns.includes(exclusionPattern));
  let canSubmit = $derived(exclusionPattern && !exclusionPatterns.includes(exclusionPattern));

  const onsubmit = (event: Event) => {
    event.preventDefault();
    if (canSubmit) {
      onSubmit(exclusionPattern);
    }
  };
</script>

<FullScreenModal title={$t('add_exclusion_pattern')} icon={mdiFolderRemove} onClose={onCancel}>
  <form {onsubmit} autocomplete="off" id="add-exclusion-pattern-form">
    <p class="py-5 text-sm">
      {$t('admin.exclusion_pattern_description')}
      <br /><br />
      {$t('admin.add_exclusion_pattern_description')}
    </p>
    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="exclusionPattern">{$t('pattern')}</label>
      <input
        class="immich-form-input"
        id="exclusionPattern"
        name="exclusionPattern"
        type="text"
        bind:value={exclusionPattern}
      />
    </div>
    <div class="mt-8 flex w-full gap-4">
      {#if isDuplicate}
        <p class="text-red-500 text-sm">{$t('errors.exclusion_pattern_already_exists')}</p>
      {/if}
    </div>
  </form>

  {#snippet stickyBottom()}
    <Button shape="round" color="secondary" fullWidth onclick={onCancel}>{$t('cancel')}</Button>
    {#if isEditing}
      <Button shape="round" color="danger" fullWidth onclick={onDelete}>{$t('delete')}</Button>
    {/if}
    <Button shape="round" type="submit" disabled={!canSubmit} fullWidth form="add-exclusion-pattern-form"
      >{submitText}</Button
    >
  {/snippet}
</FullScreenModal>
