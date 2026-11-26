<script lang="ts">
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { updateMyUserMutation } from '#lib/queries/user.query.ts';
  import { Button, Field, Input } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { cloneDeep } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { createBubbler, preventDefault } from 'svelte/legacy';
  import { fade } from 'svelte/transition';

  let editedUser = $state({ ...cloneDeep(authManager.user), name: authManager.user.name ?? '' });
  const bubble = createBubbler();

  const updateMyUser = createMutation(updateMyUserMutation);

  const handleSaveProfile = () =>
    updateMyUser.mutate([{ userUpdateMeDto: { email: editedUser.email, name: editedUser.name } }], {
      onSuccess: (user) => Object.assign(editedUser, user),
    });
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={preventDefault(bubble('submit'))}>
      <div class="flex flex-col gap-4 sm:ms-8">
        <Field label={$t('user_id')} disabled>
          <Input bind:value={editedUser.id} />
        </Field>

        <Field label={$t('email')} required>
          <Input type="email" bind:value={editedUser.email} />
        </Field>

        <Field label={$t('name')} required>
          <Input bind:value={editedUser.name} />
        </Field>

        <Field label={$t('storage_label')} disabled>
          <Input value={editedUser.storageLabel || ''} />
        </Field>

        <div class="flex justify-end">
          <Button shape="round" type="submit" size="small" onclick={() => handleSaveProfile()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
