<script lang="ts">
  import type { LibraryResponseDto } from '@immich/sdk';
  import Button from '../elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';

  export let library: Partial<LibraryResponseDto>;
  export let onCancel: () => void;
  export let onSubmit: (library: Partial<LibraryResponseDto>) => void;
</script>

<form on:submit|preventDefault={() => onSubmit({ ...library })} autocomplete="off" class="m-4 flex flex-col gap-2">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="path">{$t('name')}</label>
    <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
  </div>
  <div class="flex w-full justify-end gap-2 pt-2">
    <Button size="sm" color="gray" on:click={onCancel}>{$t('cancel')}</Button>
    <Button size="sm" type="submit">{$t('save')}</Button>
  </div>
</form>
