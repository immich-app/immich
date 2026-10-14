<script lang="ts">
  import { Button, CodeBlock, Heading, HStack, VStack, Text, Code, Markdown } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight, mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { diff, bash, yaml } from 'svelte-highlight/languages';
  import { listDatabaseBackups, MaintenanceAction, setMaintenanceMode, type DatabaseBackupDto } from '@immich/sdk';
  import { DateTime } from 'luxon';

  type Props = {
    end: () => void;
  };

  const { end }: Props = $props();

  const getDatabaseMigrationBackup = async () => {
    const response = await listDatabaseBackups();
    let latestBackup: [DateTime, DatabaseBackupDto] | undefined;

    for (const backup of response.backups) {
      if (!backup.filename.startsWith('database-migration-point-')) {
        continue;
      }

      const groups = backup.filename.match(/\d+T\d+/);

      if (!groups) {
        continue;
      }

      const createdAt = DateTime.fromFormat(groups[0], "yyyyMMdd'T'HHmmss", { zone: backup.timezone });
      if (!latestBackup?.[0] || latestBackup[0] <= createdAt) {
        latestBackup = [createdAt, backup];
      }
    }

    return latestBackup?.[1];
  };

  const code = `
[...]
database:
  container_name: immich_postgres
-  image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0@sha256:bcf63357191b76a916ae5eb93464d65c07511da41e3bf7a8416db519b40b1c23
+  image: ghcr.io/immich-app/postgres:18-vectorchord1.1.1
  environment:
    [...]
  volumes:
-      - \${UPLOAD_LOCATION}/postgres:/var/lib/postgresql/data
+      - \${UPLOAD_LOCATION}/postgres:/var/lib/postgresql
`;

  let stage = $state(0);
</script>

<Heading>{$t('maintenance_database_migration')}</Heading>
<VStack fullWidth class="items-start text-start">
  {#if stage === 0}
    <Text>First, stop your postgres container:</Text>
    <CodeBlock code="docker stop immich_postgres" language={bash} />
    <Text>If you use a service like Portainer you may also use the button in its UI instead.</Text>
  {:else if stage === 1}
    <Text>
      Next, locate the postgres folder on your host. With our recommended compose file it is at <Code
        >{'${UPLOAD_LOCATION}/postgres'}</Code
      >. You can always find the path on the left hand side of the volume mount, e.g.:
    </Text>
    <CodeBlock language={yaml} code={'- ${UPLOAD_LOCATION}/postgres:/var/lib/postgresql/data'} />
    <Text>Move this folder to a temporary folder such as <Code>postgres_tmp</Code>.</Text>
  {:else if stage === 2}
    <Text>
      Next, update your compose file with the new postgres image and volume location. If you have a different left hand
      side for the volume mount, keep that and only change the right hand side.
    </Text>
    <CodeBlock {code} language={diff} />
  {:else if stage === 3}
    <Text>
      Lastly, start up the postgres container with the new image and volume mount. This can be done by running this
      while in the folder where your docker compose file is located at:
    </Text>
    <CodeBlock language={bash} code="docker compose up -d" />
  {:else}
    {#await getDatabaseMigrationBackup() then backup}
      <Text>Finally, confirm that you have done all of the following steps in order:</Text>
      <Markdown.List ordered>
        <Markdown.ListItem>Stopped the postgres container</Markdown.ListItem>
        <Markdown.ListItem>Moved the postgres folder to a temporary place</Markdown.ListItem>
        <Markdown.ListItem
          >Updated the postgres image in the docker compose file as well as the volume mount accordingly</Markdown.ListItem
        >
      </Markdown.List>
      <Text>
        After hitting done, Immich will automatically restore the backup it took from the old database (<Code
          >{backup?.filename}</Code
        >) and start back up. If Immich successfully started back up, the temporary postgres folder (moved to <Code
          >postgres_tmp</Code
        >) can be deleted.
      </Text>

      <HStack class="self-center">
        <Button onclick={() => stage--} variant="ghost" leadingIcon={mdiArrowLeft}>{$t('back')}</Button>
        <Button
          onclick={() =>
            setMaintenanceMode({
              setMaintenanceModeDto: {
                action: MaintenanceAction.RestoreDatabase,
                restoreBackupFilename: backup?.filename,
              },
            })}
          trailingIcon={mdiCheck}
          disabled={backup === undefined}>{$t('done')}</Button
        >
      </HStack>
    {/await}
  {/if}
</VStack>

{#if stage < 4}
  <HStack>
    {#if stage === 0}
      <Button onclick={end} variant="ghost">{$t('cancel')}</Button>
    {:else}
      <Button onclick={() => stage--} variant="ghost" leadingIcon={mdiArrowLeft}>{$t('back')}</Button>
    {/if}
    <Button onclick={() => stage++} trailingIcon={mdiArrowRight}>{$t('next')}</Button>
  </HStack>
{/if}
