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

<Heading size="large" color="primary" tag="h1">Where would you like to restore from?</Heading>
<HStack>
  <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
  <Button onclick={flowToYucca} trailingIcon={mdiArrowRight}>FUTO Backups</Button>
  <Button onclick={flowToDatabase} trailingIcon={mdiArrowRight}>Database Backup</Button>
</HStack>
