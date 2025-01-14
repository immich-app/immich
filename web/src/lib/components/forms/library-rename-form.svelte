<script lang="ts">
  import type { LibraryResponseDto } from '@immich/sdk';
  import Button from '../elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    library: Partial<LibraryResponseDto>;
    onCancel: () => void;
    onSubmit: (library: Partial<LibraryResponseDto>) => void;
  }

  let { library = $bindable(), onCancel, onSubmit }: Props = $props();

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit({ ...library });
  };
</script>

<form {onsubmit} autocomplete="off" class="m-4 flex flex-col gap-2">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="path">{$t('name')}</label>
    <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
  </div>
  <div class="flex w-full justify-end gap-2 pt-2">
    <Button size="sm" color="gray" onclick={onCancel}>{$t('cancel')}</Button>
    <Button size="sm" type="submit">{$t('save')}</Button>
  </div>
</form>
