<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';
  import PinCodeCreateForm from '$lib/components/user-settings-page/PinCodeCreateForm.svelte';
  import PincodeInput from '$lib/components/user-settings-page/PinCodeInput.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { verifyPinCode } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiLockOpenVariantOutline, mdiLockOutline, mdiLockSmart } from '@mdi/js';
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

  const onPinFilled = async (code: string, withDelay = false) => {
    try {
      await verifyPinCode({ pinCodeSetupDto: { pinCode: code } });

      isVerified = true;

      if (withDelay) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      void goto(data.continuePath ?? AppRoute.LOCKED);
    } catch (error) {
      handleError(error, $t('wrong_pin_code'));
      isBadPinCode = true;
    }
  };
</script>

<AuthPageLayout withHeader={false}>
  {#if hasPinCode}
    <div class="flex items-center justify-center">
      <div class="w-96 flex flex-col gap-6 items-center justify-center">
        {#if isVerified}
          <div in:fade={{ duration: 200 }}>
            <Icon icon={mdiLockOpenVariantOutline} size="64" class="text-success/90" />
          </div>
        {:else}
          <div class:text-danger={isBadPinCode} class:text-primary={!isBadPinCode}>
            <Icon icon={mdiLockOutline} size="64" />
          </div>
        {/if}

        <p class="text-center text-sm" style="text-wrap: pretty;">{$t('enter_your_pin_code_subtitle')}</p>

        <PincodeInput
          type="password"
          autofocus
          label=""
          bind:value={pinCode}
          tabindexStart={1}
          pinLength={6}
          onFilled={(pinCode) => onPinFilled(pinCode, true)}
        />
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center">
      <div class="w-96 flex flex-col gap-6 items-center justify-center">
        <div class="text-primary">
          <Icon icon={mdiLockSmart} size="64" />
        </div>
        <p class="text-center text-sm mb-4" style="text-wrap: pretty;">
          {$t('new_pin_code_subtitle')}
        </p>
        <PinCodeCreateForm showLabel={false} onCreated={() => (hasPinCode = true)} />
      </div>
    </div>
  {/if}
</AuthPageLayout>
