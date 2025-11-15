<script lang="ts">
  import ActionBuilder from '$lib/components/workflow/ActionBuilder.svelte';
  import FilterBuilder from '$lib/components/workflow/FilterBuilder.svelte';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createWorkflow,
    PluginTriggerType,
    updateWorkflow,
    type PluginResponseDto,
    type WorkflowResponseDto,
  } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Switch, Textarea } from '@immich/ui';
  import { mdiAutoFix } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    workflow?: WorkflowResponseDto;
    plugins: PluginResponseDto[];
    onClose: () => void;
    onSave: (workflow: WorkflowResponseDto) => void;
  }

  let { workflow, plugins, onClose, onSave }: Props = $props();

  const isEditMode = !!workflow;

  // Form state
  let name = $state(workflow?.name || '');
  let description = $state(workflow?.description || '');
  let triggerType = $state<PluginTriggerType>(workflow?.triggerType || PluginTriggerType.AssetCreate);
  let enabled = $state(workflow?.enabled ?? true);
  let filters = $state<Array<{ filterId: string; filterConfig?: object }>>(
    workflow?.filters.map((f) => ({ filterId: f.filterId, filterConfig: f.filterConfig || undefined })) || [],
  );
  let actions = $state<Array<{ actionId: string; actionConfig?: object }>>(
    workflow?.actions.map((a) => ({ actionId: a.actionId, actionConfig: a.actionConfig || undefined })) || [],
  );

  // Editor mode state
  let editorMode = $state<'visual' | 'json'>('visual');
  let jsonText = $state('');
  let jsonError = $state('');

  // Sync JSON when switching to JSON mode
  const syncToJson = () => {
    const workflowData = {
      ...(isEditMode ? { id: workflow!.id } : {}),
      name,
      description,
      triggerType,
      enabled,
      filters,
      actions,
    };
    jsonText = JSON.stringify(workflowData, null, 2);
    jsonError = '';
  };

  // Sync visual form when switching from JSON mode
  const syncFromJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      name = parsed.name || '';
      description = parsed.description || '';
      triggerType = parsed.triggerType || PluginTriggerType.AssetCreate;
      enabled = parsed.enabled ?? true;
      filters = parsed.filters || [];
      actions = parsed.actions || [];
      jsonError = '';
    } catch (error) {
      jsonError = error instanceof Error ? error.message : 'Invalid JSON';
    }
  };

  const handleModeChange = (newMode: 'visual' | 'json') => {
    if (newMode === 'json' && editorMode === 'visual') {
      syncToJson();
    } else if (newMode === 'visual' && editorMode === 'json') {
      syncFromJson();
    }
    editorMode = newMode;
  };

  const handleSubmit = async () => {
    // If in JSON mode, sync from JSON first
    if (editorMode === 'json') {
      syncFromJson();
      if (jsonError) {
        return;
      }
    }

    if (!name.trim()) {
      handleError(new Error($t('name_required')), $t('validation_error'));
      return;
    }

    const trigger =
      triggerType === PluginTriggerType.AssetCreate
        ? PluginTriggerType.AssetCreate
        : PluginTriggerType.PersonRecognized;

    try {
      let result: WorkflowResponseDto;
      result = await (isEditMode
        ? updateWorkflow({
            id: workflow!.id,
            workflowUpdateDto: {
              name,
              description: description || undefined,
              enabled,
              filters,
              actions,
            },
          })
        : createWorkflow({
            workflowCreateDto: {
              name,
              description: description || undefined,
              triggerType: trigger,
              enabled,
              filters,
              actions,
            },
          }));
      onSave(result);
      onClose();
    } catch (error) {
      handleError(error, isEditMode ? $t('errors.unable_to_create') : $t('errors.unable_to_create'));
    }
  };
</script>

<Modal title={isEditMode ? $t('edit_workflow') : $t('create_workflow')} icon={mdiAutoFix} {onClose} size="large">
  <ModalBody>
    <div class="mb-4">
      <GroupTab
        filters={['visual', 'json']}
        labels={[$t('visual_builder'), $t('json_editor')]}
        selected={editorMode}
        label={$t('editor_mode')}
        onSelect={(mode) => handleModeChange(mode as 'visual' | 'json')}
      />
    </div>

    {#if editorMode === 'visual'}
      <form
        id="workflow-form"
        onsubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        class="mt-4 flex flex-col gap-4"
      >
        <Field label={$t('name')} required>
          <Input bind:value={name} required />
        </Field>

        <Field label={$t('description')}>
          <Textarea bind:value={description} />
        </Field>

        {#if !isEditMode}
          <Field label={$t('trigger_type')} required>
            <select bind:value={triggerType} class="immich-form-input w-full" required>
              <option value={PluginTriggerType.AssetCreate}>{$t('asset_created')}</option>
              <option value={PluginTriggerType.PersonRecognized}>{$t('person_recognized')}</option>
            </select>
          </Field>
        {:else}
          <Field label={$t('trigger_type')}>
            <Input value={triggerType} disabled />
          </Field>
        {/if}

        <Field label={$t('enabled')}>
          <Switch bind:checked={enabled} />
        </Field>

        <div class="border-t pt-4 dark:border-gray-700">
          <h3 class="mb-2 font-semibold">{$t('filter')}</h3>
          <FilterBuilder bind:filters {triggerType} {plugins} />
        </div>

        <div class="border-t pt-4 dark:border-gray-700">
          <h3 class="mb-2 font-semibold">{$t('actions')}</h3>
          <ActionBuilder bind:actions {triggerType} {plugins} />
        </div>
      </form>
    {:else}
      <div class="mt-4 flex flex-col gap-4">
        {#if jsonError}
          <div class="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
            {$t('json_error')}: {jsonError}
          </div>
        {/if}
        <Field label={$t('workflow_json')}>
          <textarea bind:value={jsonText} class="immich-form-input h-96 w-full font-mono text-sm" spellcheck="false"
          ></textarea>
        </Field>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {$t('workflow_json_help')}
        </p>
      </div>
    {/if}
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button color="secondary" fullWidth onclick={onClose}>{$t('cancel')}</Button>
      <Button type="submit" fullWidth form="workflow-form" onclick={handleSubmit}>
        {isEditMode ? $t('save') : $t('create')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
