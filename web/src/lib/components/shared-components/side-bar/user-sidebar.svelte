<script lang="ts">
  import { Route } from '$lib/route';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { AppShellSidebar, NavbarItem } from '@immich/ui';
  import { mdiCogOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<AppShellSidebar bind:open={sidebarStore.isOpen} ariaLabel={$t('primary')}>
  <NavbarItem title={$t('settings')} href={Route.userSettings()} icon={mdiCogOutline} />
</AppShellSidebar>
