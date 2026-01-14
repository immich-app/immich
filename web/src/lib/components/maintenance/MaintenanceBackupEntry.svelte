<script lang="ts">
  import HeaderActionButton from '$lib/components/HeaderActionButton.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { getDatabaseBackupActions, handleRestoreDatabaseBackup } from '$lib/services/database-backups.service';
  import { locale } from '$lib/stores/preferences.store';
  import { Card, CardBody, ContextMenuButton, HStack, Stack, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
  };

  const { filename }: Props = $props();

  const timeText = $derived(
    filename ? DateTime.fromFormat(filename, "yyyyMMdd'T'HHmmss").toRelative({ locale: $locale }) : null,
  );

  const { Download, Delete } = $derived(getDatabaseBackupActions($t, filename));

  let isDeleting = $state(false);

  function onBackupDeleteStatus(event: { filename: string; isDeleting: boolean }) {
    if (event.filename === filename) {
      isDeleting = event.isDeleting;
    }
  }
</script>

<OnEvents {onBackupDeleteStatus} />

<Card>
  <CardBody>
    <HStack>
      <Stack class="grow">
        <Text>{filename}</Text>
        {#if timeText}
          <Text color="primary" size="small">{timeText}</Text>
        {/if}
      </Stack>

      <HeaderActionButton
        action={{
          color: 'primary',
          title: $t('restore'),
          onAction: () => handleRestoreDatabaseBackup(filename),
          $if: () => !isDeleting,
        }}
      />

      <ContextMenuButton
        disabled={isDeleting}
        position="top-right"
        aria-label={$t('open')}
        items={[Download, Delete]}
      />
    </HStack>
  </CardBody>
</Card>
