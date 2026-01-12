<script lang="ts">
  import { Button, Heading, HStack, Scrollable } from '@immich/ui';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MaintenanceBackupsList from '../MaintenanceBackupsList.svelte';

  type Props = {
    previous: () => void;
    end: () => void;
  };

  const { previous, end }: Props = $props();
</script>

<Heading size="large" color="primary" tag="h1">{$t('maintenance_restore_from_backup')}</Heading>
<Scrollable class="max-h-80">
  <MaintenanceBackupsList />
</Scrollable>
<HStack>
  <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
  <Button onclick={previous} variant="ghost" leadingIcon={mdiArrowLeft}>{$t('back')}</Button>
</HStack>
