<script lang="ts">
  import { Button, Heading, HStack, Scrollable } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MaintenanceBackupsList from '../MaintenanceBackupsList.svelte';

  type Props = {
    previous: () => void;
    end: () => void;
    expectedVersion: string;
  };

  const { previous, end, expectedVersion }: Props = $props();
</script>

<Heading size="large" color="primary" tag="h1">{$t('maintenance_restore_from_backup')}</Heading>
<Scrollable class="max-h-120 bg-white dark:bg-black p-4 rounded-2xl border border-light-300 w-full">
  <MaintenanceBackupsList {expectedVersion} />
</Scrollable>
<HStack>
  <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
  <Button onclick={previous} variant="ghost" leadingIcon={mdiArrowLeft}>{$t('back')}</Button>
</HStack>
