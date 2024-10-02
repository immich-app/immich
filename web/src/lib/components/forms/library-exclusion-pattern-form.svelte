<script lang="ts">
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiFolderRemove } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  export let exclusionPattern: string;
  export let exclusionPatterns: string[] = [];
  export let isEditing = false;
  export let submitText = $t('submit');
  export let onCancel: () => void;
  export let onSubmit: (exclusionPattern: string) => void;
  export let onDelete: () => void = () => {};

  onMount(() => {
    if (isEditing) {
      exclusionPatterns = exclusionPatterns.filter((pattern) => pattern !== exclusionPattern);
    }
  });

  $: isDuplicate = exclusionPattern !== null && exclusionPatterns.includes(exclusionPattern);
  $: canSubmit = exclusionPattern && !exclusionPatterns.includes(exclusionPattern);
</script>

<FullScreenModal title={$t('add_exclusion_pattern')} icon={mdiFolderRemove} onClose={onCancel}>
  <form on:submit|preventDefault={() => onSubmit(exclusionPattern)} autocomplete="off" id="add-exclusion-pattern-form">
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
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onCancel}>{$t('cancel')}</Button>
    {#if isEditing}
      <Button color="red" fullwidth on:click={onDelete}>{$t('delete')}</Button>
    {/if}
    <Button type="submit" disabled={!canSubmit} fullwidth form="add-exclusion-pattern-form">{submitText}</Button>
  </svelte:fragment>
</FullScreenModal>
