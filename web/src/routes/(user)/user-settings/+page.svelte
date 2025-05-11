<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { mdiKeyboard } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <CircleIconButton
      icon={mdiKeyboard}
      title={$t('show_keyboard_shortcuts')}
      onclick={() => modalManager.show(ShortcutsModal, {})}
    />
  {/snippet}
  <section class="mx-4 flex place-content-center">
    <div class="w-full max-w-3xl">
      <UserSettingsList keys={data.keys} sessions={data.sessions} />
    </div>
  </section>
</UserPageLayout>
