<script lang="ts">
  import UserPageLayout from '#lib/components/layouts/UserPageLayout.svelte';
  import { getKeyboardActions } from '#lib/services/keyboard.service.ts';
  import { Container } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import UserSettingsList from './UserSettingsList.svelte';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const { KeyboardShortcuts } = $derived(getKeyboardActions($t));
</script>

<UserPageLayout title={data.meta.title} actions={[KeyboardShortcuts]}>
  <Container size="medium" center>
    <UserSettingsList />
  </Container>
</UserPageLayout>
