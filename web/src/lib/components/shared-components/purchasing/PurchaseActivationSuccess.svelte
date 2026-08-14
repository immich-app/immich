<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { setSupportBadgeVisibility } from '$lib/utils/purchase-utils';
  import { Button, Icon } from '@immich/ui';
  import { mdiPartyPopper } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onDone: () => void;
  }

  let { onDone }: Props = $props();
</script>

<div class="m-auto my-6 flex w-3/4 flex-col place-content-center place-items-center text-center">
  <Icon icon={mdiPartyPopper} class="text-primary" size="96" />
  <p class="mt-8 text-4xl font-bold">{$t('purchase_activated_title')}</p>
  <p class="mt-6 text-lg">{$t('purchase_activated_subtitle')}</p>

  <div class="mt-6 mb-4 w-full rounded-xl border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900">
    <SettingSwitch
      title={$t('show_supporter_badge')}
      subtitle={$t('show_supporter_badge_description')}
      bind:checked={authManager.preferences.purchase.showSupportBadge}
      onToggle={setSupportBadgeVisibility}
    />
  </div>

  <div class="mt-6 w-full">
    <Button fullWidth shape="round" onclick={onDone}>{$t('ok')}</Button>
  </div>
</div>
