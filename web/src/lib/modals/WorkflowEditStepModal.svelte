<script lang="ts">
  import SchemaConfiguration from '$lib/components/SchemaConfiguration.svelte';
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import PluginMethodPicker from '$lib/modals/PluginMethodPicker.svelte';
  import { type JSONSchemaProperty, type SchemaConfig } from '$lib/types';
  import { getWorkflowDefaultConfig } from '$lib/utils/workflow';
  import { WorkflowTrigger, type WorkflowStepDto } from '@immich/sdk';
  import { Button, FormModal, modalManager, Stack, Text, Textarea } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    trigger: WorkflowTrigger;
    step: WorkflowStepDto;
    onClose: (step?: WorkflowStepDto) => void;
  };

  const { trigger, step, onClose }: Props = $props();

  const onSubmit = () => onClose(method ? { method: method.key, config, enabled } : undefined);

  let enabled = $state<boolean>(true);
  let method = $state(pluginManager.getMethod(step.method));
  let config = $state<SchemaConfig>(step.config);
  let debug = $state(false);

  const onPickMethod = async () => {
    const selected = await modalManager.show(PluginMethodPicker, { trigger, selectedKey: method?.key });
    if (!selected) {
      return;
    }

    method = selected;
    config = selected.schema ? getWorkflowDefaultConfig(selected.schema as JSONSchemaProperty) : null;
  };
</script>

{#if method}
  <FormModal title={$t('step_details')} {onClose} {onSubmit} disabled={!method} size="medium">
    <div class="flex items-center justify-between gap-2">
      <div class="grow text-start">
        <Text fontWeight="medium">{method.title}</Text>
        {#if method.description}
          <Text size="small" color="muted">{method.description}</Text>
        {/if}
      </div>
      <Button size="small" color="secondary" shape="round" onclick={onPickMethod} leadingIcon={mdiPencilOutline}
        >{$t('change')}</Button
      >
    </div>

    {#if method.schema}
      <hr class="my-4" />
      <div class="mt-4 grow text-start">
        <Text fontWeight="medium">{$t('configuration')}</Text>
        <Stack gap={4}>
          <SchemaConfiguration schema={method.schema as JSONSchemaProperty} bind:config root />
        </Stack>
      </div>
    {/if}

    {#if debug}
      <hr class="my-4" />
      <Text fontWeight="medium">{$t('preview')}</Text>
      <Textarea class="mt-2" readonly grow value={JSON.stringify({ method: method.key, config }, null, 2)} />
    {/if}
  </FormModal>
{/if}
