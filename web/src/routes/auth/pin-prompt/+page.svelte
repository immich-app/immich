<script lang="ts">
  import AuthPageLayout from '#lib/components/layouts/AuthPageLayout.svelte';
  import PinCodeUnlockForm from '#lib/components/user-settings-page/PinCodeUnlockForm.svelte';
  import { Route } from '#lib/route.ts';
  import { Button, Icon } from '@immich/ui';
  import { mdiLockOpenVariantOutline, mdiLockOutline, mdiLockSmart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const navigateAfterVerification = () => setTimeout(() => void goto(data.continueUrl), 1000);
</script>

<AuthPageLayout withHeader={false}>
  <div class="flex items-center justify-center">
    <div class="flex w-96 flex-col items-center justify-center gap-6">
      <PinCodeUnlockForm onVerified={navigateAfterVerification} showSetupLabel={false}>
        {#snippet prompt(isVerified, isBadPinCode)}
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
        {/snippet}
        {#snippet setup()}
          <div class="text-primary">
            <Icon icon={mdiLockSmart} size="64" />
          </div>
          <p class="mb-4 text-center text-sm" style="text-wrap: pretty;">
            {$t('new_pin_code_subtitle')}
          </p>
        {/snippet}
        {#snippet footer(hasPinCode)}
          <div class={hasPinCode ? '' : 'flex w-full items-start'}>
            <Button type="button" color="secondary" onclick={() => goto(Route.photos())}>{$t('cancel')}</Button>
          </div>
        {/snippet}
      </PinCodeUnlockForm>
    </div>
  </div>
</AuthPageLayout>
