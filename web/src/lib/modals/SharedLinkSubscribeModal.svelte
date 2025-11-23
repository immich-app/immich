<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { subscribeToSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter, toastManager } from '@immich/ui';
  import { mdiAccountPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
    sharedLink: SharedLinkResponseDto;
  };

  const { onClose, sharedLink }: Props = $props();

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let isSubmitting = $state(false);

  const handleSubscribe = async () => {
    if (password !== confirmPassword) {
      toastManager.error($t('password_mismatch'));
      return;
    }

    try {
      isSubmitting = true;
      await subscribeToSharedLink({
        key: sharedLink.key,
        sharedLinkSubscribeDto: {
          name,
          email,
          password,
        },
      });

      toastManager.success($t('subscription_successful'));
      onClose();
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toastManager.error($t('subscription_failed'));
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Modal size="small" title={$t('subscribe_to_album')} icon={mdiAccountPlus} {onClose}>
  <ModalBody>
    <div class="text-primary">
      <p class="text-sm dark:text-immich-dark-fg">
        {$t('subscribe_to_album_description')}
      </p>
    </div>

    <form onsubmit={handleSubscribe} autocomplete="off" id="subscribe-form">
      <div class="my-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('name')}
          bind:value={name}
          required={true}
          autofocus={true}
        />
        <SettingInputField
          inputType={SettingInputFieldType.EMAIL}
          label={$t('email')}
          bind:value={email}
          required={true}
        />
        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label={$t('password')}
          bind:value={password}
          required={true}
        />
        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label={$t('confirm_password')}
          bind:value={confirmPassword}
          required={true}
        />
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack gap="xs">
      <Button variant="secondary" onclick={onClose}>{$t('cancel')}</Button>
      <Button
        variant="primary"
        type="submit"
        form="subscribe-form"
        disabled={isSubmitting || !name || !email || !password || !confirmPassword}
      >
        {$t('subscribe')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
