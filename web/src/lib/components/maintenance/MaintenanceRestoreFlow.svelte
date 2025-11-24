<script lang="ts">
  import MaintenanceBackupsList from '$lib/components/maintenance/MaintenanceBackupsList.svelte';
  import { integrityCheck, type MaintenanceIntegrityResponseDto } from '@immich/sdk';
  import { Button, Card, CardBody, Heading, HStack, Icon, Scrollable, Stack, Text } from '@immich/ui';
  import { mdiAlert, mdiArrowLeft, mdiArrowRight, mdiCheck, mdiClose, mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';

  interface Props {
    end?: () => void;
  }

  let props: Props = $props();
  let stage = $state(0);

  let integrity: MaintenanceIntegrityResponseDto | undefined = $state();

  async function reload() {
    integrity = await integrityCheck();
  }

  onMount(reload);

  const i18nMap = {
    'encoded-video': 'Encoded Video',
    library: 'Library',
    upload: 'Upload',
    profile: 'Profile',
    thumbs: 'Thumbs',
    backups: 'Backups',
  };
</script>

{#if stage === 0}
  <Heading size="large" color="primary" tag="h1">Restore Your Library</Heading>
  <Text
    >Before restoring a database backup, you must ensure your library has been restored or is otherwise already present.</Text
  >
  <Card>
    <CardBody>
      <Stack>
        {#if integrity}
          {#each integrity.storage as { folder, readable, writable } (folder)}
            <HStack>
              <Icon
                icon={writable ? mdiCheck : mdiClose}
                color={`rgb(var(--immich-ui-${writable ? 'success' : 'danger'}))`}
              />
              <Text
                >{i18nMap[folder as keyof typeof i18nMap]} ({writable
                  ? 'readable and writable'
                  : readable
                    ? 'not writable'
                    : 'not readable'})</Text
              >
            </HStack>
          {/each}
          {#each integrity.storage as { folder, files } (folder)}
            {#if folder !== 'backups'}
              <HStack class="items-start">
                <Icon
                  class="mt-1"
                  icon={files ? mdiCheck : folder === 'profile' || folder === 'upload' ? mdiClose : mdiAlert}
                  color={`rgb(var(--immich-ui-${files ? 'success' : folder === 'profile' || folder === 'upload' ? 'danger' : 'warning'}))`}
                />
                <Stack gap={0} class="items-start">
                  <Text>
                    {#if files}
                      {i18nMap[folder as keyof typeof i18nMap]} has {files} folder(s)
                    {:else}
                      {i18nMap[folder as keyof typeof i18nMap]} is missing files!
                    {/if}
                  </Text>
                  {#if !files && (folder === 'profile' || folder === 'upload')}
                    <Text variant="italic">You may be missing files</Text>
                  {/if}
                  {#if !files && (folder === 'encoded-video' || folder === 'thumbs')}
                    <Text variant="italic">You can regenerate these later in settings</Text>
                  {/if}
                  {#if !files && folder === 'library'}
                    <Text variant="italic">Using storage template? You may be missing files</Text>
                  {/if}
                </Stack>
              </HStack>
            {/if}
          {/each}

          <Button leadingIcon={mdiRefresh} variant="ghost" onclick={reload}>Refresh</Button>
        {:else}
          <HStack>
            <Icon icon={mdiRefresh} color="rgb(var(--immich-ui-primary))" />
            <Text>Loading integrity checks and heuristics...</Text>
          </HStack>
        {/if}
      </Stack>
    </CardBody>
  </Card>
  <Text>If this looks correct, continue to restoring a backup!</Text>
  <HStack>
    <Button onclick={props.end} variant="ghost">Cancel</Button>
    <Button onclick={() => stage++} trailingIcon={mdiArrowRight}>Next</Button>
  </HStack>
{:else}
  <Heading size="large" color="primary" tag="h1">Restore From Backup</Heading>
  <Scrollable class="max-h-[320px]">
    <MaintenanceBackupsList />
  </Scrollable>
  <HStack>
    <Button onclick={props.end} variant="ghost">Cancel</Button>
    <Button onclick={() => stage--} variant="ghost" leadingIcon={mdiArrowLeft}>Back</Button>
  </HStack>
{/if}
