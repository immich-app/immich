<script lang="ts">
  import {
    getDatabaseBackupActions,
    handleDeleteDatabaseBackup,
    handleRestoreDatabaseBackup,
    handleUploadDatabaseBackup,
  } from '$lib/services/database-backups.service';
  import { locale } from '$lib/stores/preferences.store';
  import { listDatabaseBackups } from '@immich/sdk';
  import {
    Button,
    Card,
    CardBody,
    HStack,
    IconButton,
    menuManager,
    ProgressBar,
    Stack,
    Text,
    type ContextMenuBaseProps,
  } from '@immich/ui';
  import { mdiDotsVertical } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  type Props = {
    backups?: string[];
  };

  let props: Props = $props();

  const mapBackups = (filenames: string[]) => {
    return filenames.map((filename) => {
      const date = /\d{4}\d{2}\d{2}T\d{2}\d{2}\d{2}/.exec(filename);

      return {
        filename,
        timeText: date ? DateTime.fromFormat(date[0], "yyyyMMdd'T'HHmmss").toRelative({ locale: $locale }) : null,
      };
    });
  };

  let deleting = new SvelteSet();
  let backups = $state(mapBackups(props.backups ?? []));

  async function reloadBackups() {
    const result = await listDatabaseBackups();
    backups = mapBackups(result.backups);
  }

  onMount(() => {
    if (!props.backups) {
      void reloadBackups();
    }
  });

  async function remove(filename: string) {
    deleting.add(filename);

    if (await handleDeleteDatabaseBackup(filename)) {
      backups = backups.filter((backup) => backup.filename !== filename);
    }

    deleting.delete(filename);
  }

  const handleOpen = async (event: Event, props: Partial<ContextMenuBaseProps>, filename: string) => {
    const { Download, Delete } = getDatabaseBackupActions($t, filename, () => void remove(filename));

    await menuManager.show({
      ...props,
      target: event.currentTarget as HTMLElement,
      items: [Download, Delete],
    });
  };

  let uploadProgress = $state(-1);

  function upload() {
    void handleUploadDatabaseBackup((value) => (uploadProgress = value)).then(reloadBackups);
  }
</script>

<Stack gap={2} class="mt-4 text-left">
  <Card>
    <CardBody>
      {#if uploadProgress === -1}
        <HStack>
          <Text class="grow">{$t('admin.maintenance_upload_backup')}</Text>
          <Button size="tiny" onclick={upload}>{$t('select_from_computer')}</Button>
        </HStack>
      {:else}
        <HStack gap={8}>
          <Text class="grow">{$t('asset_uploading')}</Text>
          <ProgressBar progress={uploadProgress} size="tiny" />
        </HStack>
      {/if}
    </CardBody>
  </Card>

  {#each backups as backup (backup.filename)}
    <Card>
      <CardBody>
        <HStack>
          <Stack class="grow">
            <Text>{backup.filename}</Text>
            {#if typeof backup.timeText}
              <Text color="info" size="small">{backup.timeText}</Text>
            {/if}
          </Stack>

          <Button
            size="small"
            disabled={deleting.has(backup.filename)}
            onclick={() => handleRestoreDatabaseBackup(backup.filename)}>{$t('restore')}</Button
          >

          <IconButton
            shape="round"
            variant="ghost"
            color="secondary"
            icon={mdiDotsVertical}
            class="shrink-0"
            disabled={deleting.has(backup.filename)}
            onclick={(event: Event) => handleOpen(event, { position: 'top-right' }, backup.filename)}
            aria-label={$t('open')}
          />
        </HStack>
      </CardBody>
    </Card>
  {/each}
</Stack>
