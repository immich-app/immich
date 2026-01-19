<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { CommandPaletteDefaultProvider, modalManager, type ActionItem } from '@immich/ui';
  import { mdiKeyboard } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let open = $state(false);

  const Shortcuts = $derived<ActionItem>({
    title: $t('show_keyboard_shortcuts'),
    icon: mdiKeyboard,
    onAction: async () => {
      if (!open) {
        open = true;
        await modalManager.show(ShortcutsModal, {});
        open = false;
      }
    },
    shortcuts: [{ key: '?', shift: true }],
  });
</script>

<CommandPaletteDefaultProvider name={data.meta.title} actions={[Shortcuts]} />

<UserPageLayout title={data.meta.title} actions={[Shortcuts]}>
  <PageContent size="medium" center>
    <UserSettingsList keys={data.keys} sessions={data.sessions} />
  </PageContent>
</UserPageLayout>
