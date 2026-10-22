<script lang="ts">
  import { WorkflowTrigger, type PluginMethodResponseDto } from '@immich/sdk';
  import { Badge, BasicModal, ListButton, LoadingSpinner, Stack, Text } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { queryClient } from '$lib/queries/client';
  import { searchPluginMethodsQuery } from '$lib/queries/plugin.query';

  type Props = {
    trigger: WorkflowTrigger;
    selectedKey?: string;
    onClose: (method?: PluginMethodResponseDto) => void;
  };

  const { trigger, selectedKey, onClose }: Props = $props();

  const query = createQuery(
    () => searchPluginMethodsQuery({ trigger }),
    () => queryClient,
  );
</script>

<BasicModal title={$t('add_step')} onClose={() => onClose()} size="medium">
  {#if query.data}
    <Stack>
      {#each query.data as method (method.key)}
        <ListButton selected={method.key === selectedKey} onclick={() => onClose(method)}>
          <div class="grow text-start">
            <Text fontWeight="medium" class="flex items-center gap-1"
              >{method.title}
              {#if method.uiHints.includes('Filter')}
                <Badge size="tiny" color="info" title={$t('plugin_method_filter_type_description')}
                  >{$t('plugin_method_filter_type')}</Badge
                >
              {/if}
            </Text>
            {#if method.description}
              <Text size="tiny" color="muted">{method.description}</Text>
            {/if}
          </div>
        </ListButton>
      {/each}
    </Stack>
  {:else}
    <div class="flex w-full place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</BasicModal>
