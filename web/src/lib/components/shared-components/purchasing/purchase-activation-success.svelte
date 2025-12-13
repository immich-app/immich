<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { setSupportBadgeVisibility } from '$lib/utils/purchase-utils';
  import { Button, Icon } from '@immich/ui';
  import { mdiPartyPopper } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onDone: () => void;
  }

  let { onDone }: Props = $props();
</script>

<div class="m-auto w-3/4 text-center flex flex-col place-content-center place-items-center my-6">
  <Icon icon={mdiPartyPopper} class="text-primary" size="96" />
  <p class="text-4xl mt-8 font-bold">{$t('purchase_activated_title')}</p>
  <p class="text-lg mt-6">{$t('purchase_activated_subtitle')}</p>

  <div class="mb-4 w-full mt-6 border rounded-xl p-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
    <SettingSwitch
      title={$t('show_supporter_badge')}
      subtitle={$t('show_supporter_badge_description')}
      bind:checked={$preferences.purchase.showSupportBadge}
      onToggle={setSupportBadgeVisibility}
    />
  </div>

  <div class="mt-6 w-full">
    <Button fullWidth shape="round" onclick={onDone}>{$t('ok')}</Button>
  </div>
</div>
