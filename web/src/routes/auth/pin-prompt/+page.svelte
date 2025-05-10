<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import PinCodeCreateForm from '$lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import PincodeInput from '$lib/components/user-settings-page/PinCodeInput.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { verifyPinCode } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiLockOpenVariantOutline, mdiLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let isVerified = $state(false);
  let isBadPinCode = $state(false);
  let hasPinCode = $derived(data.hasPinCode);
  let pinCode = $state('');

  const onPinFilled = async (code: string) => {
    try {
      await verifyPinCode({
        pinCodeSetupDto: {
          pinCode: code,
        },
      });

      isVerified = true;

      setTimeout(() => {
        goto(AppRoute.LOCKED)
          .then(() => {})
          .catch(() => {});
      }, 1000);
    } catch (error) {
      handleError(error, $t('wrong_pin_code'));
      isBadPinCode = true;
    }
  };
</script>

<AuthPageLayout title="">
  {#if hasPinCode}
    <div class="flex items-center justify-center">
      <div
        class="w-96 bg-subtle flex flex-col gap-6 items-center justify-center p-8 rounded-2xl border border-gray-200 dark:border-gray-600"
      >
        <p class="text-center text-sm" style="text-wrap: pretty;">Enter your PIN code to access the locked folder</p>

        {#if isVerified}
          <div in:fade={{ duration: 200 }}>
            <Icon icon={mdiLockOpenVariantOutline} size="48" class="text-success/90" />
          </div>
        {:else}
          <div class:text-danger={isBadPinCode} class:text-primary={!isBadPinCode}>
            <Icon icon={mdiLockOutline} size="48" />
          </div>
        {/if}
        <PincodeInput autofocus label="" bind:value={pinCode} tabindexStart={1} pinLength={6} onFilled={onPinFilled} />
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center">
      <div
        class="w-96 bg-subtle flex flex-col gap-6 items-center justify-center p-8 rounded-2xl border border-gray-200 dark:border-gray-600"
      >
        <p class="text-center text-sm" style="text-wrap: pretty;">
          This is your first time accessing the locked folder. Create a PIN code to securely access this page
        </p>
        <PinCodeCreateForm showLabel={false} onCreated={onPinFilled} />
      </div>
    </div>
  {/if}
</AuthPageLayout>
