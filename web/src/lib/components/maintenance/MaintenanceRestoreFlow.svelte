<script lang="ts">
  import MaintenanceBackupsList from '$lib/components/maintenance/MaintenanceBackupsList.svelte';
  import { detectPriorInstall, type MaintenanceIntegrityResponseDto } from '@immich/sdk';
  import { Button, Card, CardBody, Heading, HStack, Icon, Scrollable, Stack, Text } from '@immich/ui';
  import { mdiAlert, mdiArrowLeft, mdiArrowRight, mdiCheck, mdiClose, mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    end?: () => void;
  }

  let props: Props = $props();
  let stage = $state(0);

  let integrity: MaintenanceIntegrityResponseDto | undefined = $state();

  async function reload() {
    integrity = await detectPriorInstall();
  }

  onMount(reload);
</script>

{#if stage === 0}
  <Heading size="large" color="primary" tag="h1">{$t('maintenance_restore_library')}</Heading>
  <Text>{$t('maintenance_restore_library_description')}</Text>
  <Card>
    <CardBody>
      <Stack>
        {#if integrity}
          {#each integrity.storage as { folder, readable, writable } (folder)}
            <HStack>
              <Icon
                icon={writable ? mdiCheck : mdiClose}
                color={`var(--immich-ui-${writable ? 'success' : 'danger'}-500)`}
              />
              <Text
                >{folder} ({$t(
                  `maintenance_restore_library_folder_${writable ? 'pass' : readable ? 'write_fail' : 'read_fail'}`,
                )})
              </Text>
            </HStack>
          {/each}
          {#each integrity.storage as { folder, files } (folder)}
            {#if folder !== 'backups'}
              <HStack class="items-start">
                <Icon
                  class="mt-1"
                  icon={files ? mdiCheck : folder === 'profile' || folder === 'upload' ? mdiClose : mdiAlert}
                  color={`var(--immich-ui-${files ? 'success' : folder === 'profile' || folder === 'upload' ? 'danger' : 'warning'}-500)`}
                />
                <Stack gap={0} class="items-start">
                  <Text>
                    {#if files}
                      {$t('maintenance_restore_library_folder_has_files', {
                        values: {
                          folder,
                          count: files,
                        },
                      })}
                    {:else}
                      {$t('maintenance_restore_library_folder_no_files', {
                        values: {
                          folder,
                        },
                      })}
                    {/if}
                  </Text>
                  {#if !files && (folder === 'profile' || folder === 'upload')}
                    <Text variant="italic">{$t('maintenance_restore_library_hint_missing_files')}</Text>
                  {/if}
                  {#if !files && (folder === 'encoded-video' || folder === 'thumbs')}
                    <Text variant="italic">{$t('maintenance_restore_library_hint_regenerate_later')}</Text>
                  {/if}
                  {#if !files && folder === 'library'}
                    <Text variant="italic">{$t('maintenance_restore_library_hint_storage_template_missing_files')}</Text
                    >
                  {/if}
                </Stack>
              </HStack>
            {/if}
          {/each}

          <Button leadingIcon={mdiRefresh} variant="ghost" onclick={reload}>{$t('refresh')}</Button>
        {:else}
          <HStack>
            <Icon icon={mdiRefresh} color="rgb(var(--immich-ui-primary))" />
            <Text>{$t('maintenance_restore_library_loading')}</Text>
          </HStack>
        {/if}
      </Stack>
    </CardBody>
  </Card>
  <Text>{$t('maintenance_restore_library_confirm')}</Text>
  <HStack>
    <Button onclick={props.end} variant="ghost">{$t('cancel')}</Button>
    <Button onclick={() => stage++} trailingIcon={mdiArrowRight}>{$t('next')}</Button>
  </HStack>
{:else}
  <Heading size="large" color="primary" tag="h1">{$t('maintenance_restore_from_backup')}</Heading>
  <Scrollable class="max-h-80">
    <MaintenanceBackupsList />
  </Scrollable>
  <HStack>
    <Button onclick={props.end} variant="ghost">{$t('cancel')}</Button>
    <Button onclick={() => stage--} variant="ghost" leadingIcon={mdiArrowLeft}>{$t('back')}</Button>
  </HStack>
{/if}
