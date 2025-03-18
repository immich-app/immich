<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import type { LibraryResponseDto } from '@immich/sdk';
  import { Button, Field, Input } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    library: Partial<LibraryResponseDto>;
    onCancel: () => void;
    onSubmit: (library: Partial<LibraryResponseDto>) => void;
  }

  let { library, onCancel, onSubmit }: Props = $props();

  let newName = $state(library.name);

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit({ ...library, name: newName });
  };
</script>

<form {onsubmit} autocomplete="off">
  <FullScreenModal icon={mdiRenameOutline} title={$t('rename')} onClose={onCancel}>
    <Field label={$t('name')}>
      <Input bind:value={newName} />
    </Field>

    {#snippet stickyBottom()}
      <Button shape="round" fullWidth color="secondary" onclick={onCancel}>{$t('cancel')}</Button>
      <Button shape="round" fullWidth type="submit">{$t('save')}</Button>
    {/snippet}
  </FullScreenModal>
</form>
