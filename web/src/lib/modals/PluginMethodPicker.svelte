<script lang="ts">
  import { searchPluginMethods, WorkflowTrigger, type PluginMethodResponseDto } from '@immich/sdk';
  import { Badge, BasicModal, ListButton, LoadingSpinner, Stack, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    trigger: WorkflowTrigger;
    selectedKey?: string;
    onClose: (method?: PluginMethodResponseDto) => void;
  };

  const { trigger, selectedKey, onClose }: Props = $props();
</script>

<BasicModal title={$t('add_step')} onClose={() => onClose()} size="medium">
  {#await searchPluginMethods({ trigger })}
    <div class="flex w-full place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {:then methods}
    <Stack>
      {#each methods as method (method.key)}
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
  {/await}
</BasicModal>
