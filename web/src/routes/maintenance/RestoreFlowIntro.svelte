<script lang="ts">
  import { Button, Heading, HStack } from '@immich/ui';
  import { mdiArrowRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    flowToYucca: () => void;
    flowToDatabase: () => void;
    end: () => void;
  };

  const { flowToYucca, flowToDatabase, end }: Props = $props();
</script>

<Heading size="large" color="primary" tag="h1">{$t('maintenance_restore_source_title')}</Heading>
<HStack>
  <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
  <Button onclick={flowToYucca} trailingIcon={mdiArrowRight}>{$t('maintenance_restore_source_futo_backups')}</Button>
  <Button onclick={flowToDatabase} trailingIcon={mdiArrowRight}
    >{$t('maintenance_restore_source_database_backup')}</Button
  >
</HStack>
