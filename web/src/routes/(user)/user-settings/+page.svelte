<script lang="ts">
  import { showShortcutsModal } from '$lib/actions/shortcut.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
  import { Container, IconButton } from '@immich/ui';
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
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      icon={mdiKeyboard}
      aria-label={$t('show_keyboard_shortcuts')}
      onclick={showShortcutsModal}
    />
  {/snippet}
  <Container size="medium" center>
    <UserSettingsList keys={data.keys} sessions={data.sessions} />
  </Container>
</UserPageLayout>
