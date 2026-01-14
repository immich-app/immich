<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { updateMyUser } from '@immich/sdk';
  import { Button, Field, Input, toastManager } from '@immich/ui';
  import { cloneDeep } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { createBubbler, preventDefault } from 'svelte/legacy';
  import { fade } from 'svelte/transition';

  let editedUser = $state(cloneDeep($user));
  const bubble = createBubbler();

  const handleSaveProfile = async () => {
    try {
      const data = await updateMyUser({
        userUpdateMeDto: {
          email: editedUser.email,
          name: editedUser.name,
        },
      });

      Object.assign(editedUser, data);
      $user = data;

      toastManager.success($t('saved_profile'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_profile'));
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={preventDefault(bubble('submit'))}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
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
