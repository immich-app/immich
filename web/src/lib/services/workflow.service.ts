import WorkflowDuplicateModal from '#lib/modals/WorkflowDuplicateModal.svelte';
import WorkflowLogsModal from '#lib/modals/WorkflowLogsModal.svelte';
import WorkflowTemplatePickerModal from '#lib/modals/WorkflowTemplatePickerModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import { createWorkflowMutation, deleteWorkflowMutation, updateWorkflowMutation } from '#lib/queries/workflow.query.ts';
import { Route } from '#lib/route.ts';
import { copyToClipboard, downloadJson } from '#lib/utils.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { WorkflowTrigger, type WorkflowResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import {
  mdiCodeJson,
  mdiContentCopy,
  mdiContentDuplicate,
  mdiDeleteOutline,
  mdiDownload,
  mdiFileDocumentMultipleOutline,
  mdiHistory,
  mdiPause,
  mdiPencil,
  mdiPlay,
  mdiPlus,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { page } from '$app/state';

export const getWorkflowsActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('create_workflow'),
    icon: mdiPlus,
    onAction: () =>
      executeMutation(
        createWorkflowMutation,
        [{ workflowCreateDto: { trigger: WorkflowTrigger.AssetCreate, steps: [], enabled: false } }],
        { onSuccess: (workflow) => void goto(Route.viewWorkflow(workflow)) },
      ),
  };

  const UseTemplate: ActionItem = {
    title: $t('browse_templates'),
    icon: mdiFileDocumentMultipleOutline,
    onAction: () => modalManager.show(WorkflowTemplatePickerModal, {}),
  };

  return { Create, UseTemplate };
};

export const getWorkflowActions = ($t: MessageFormatter, workflow: WorkflowResponseDto) => {
  const ToggleEnabled: ActionItem = {
    title: workflow.enabled ? $t('disable') : $t('enable'),
    icon: workflow.enabled ? mdiPause : mdiPlay,
    onAction: () =>
      executeMutation(updateWorkflowMutation, [{ id: workflow.id, workflowUpdateDto: { enabled: !workflow.enabled } }]),
  };

  const CopyJson: ActionItem = {
    title: $t('copy_json'),
    icon: mdiContentCopy,
    onAction: () =>
      copyToClipboard(
        JSON.stringify(
          {
            name: workflow.name,
            description: workflow.description,
            enabled: workflow.enabled,
            trigger: workflow.trigger,
            steps: workflow.steps,
          },
          null,
          2,
        ),
      ),
  };

  const Download: ActionItem = {
    title: $t('download'),
    icon: mdiDownload,
    onAction: () =>
      downloadJson(
        {
          name: workflow.name,
          description: workflow.description,
          enabled: workflow.enabled,
          trigger: workflow.trigger,
          steps: workflow.steps,
        },
        'workflow.json',
      ),
  };

  const Duplicate: ActionItem = {
    title: $t('duplicate'),
    icon: mdiContentDuplicate,
    onAction: async () => modalManager.show(WorkflowDuplicateModal, { workflow }),
  };

  const Edit: ActionItem = {
    title: $t('edit'),
    icon: mdiPencil,
    onAction: () => goto(Route.viewWorkflow(workflow)),
  };

  const Delete: ActionItem = {
    title: $t('delete'),
    icon: mdiDeleteOutline,
    color: 'danger',
    onAction: () => handleDeleteWorkflow(workflow),
  };

  const Logs: ActionItem = {
    title: $t('check_logs'),
    icon: mdiHistory,
    onAction: () => modalManager.show(WorkflowLogsModal, { workflow }),
  };

  return { CopyJson, Download, Duplicate, ToggleEnabled, Edit, Delete, Logs };
};

export const getWorkflowShowSchemaAction = (
  $t: MessageFormatter,
  isExpanded: boolean,
  onToggle: () => void,
): ActionItem => ({
  title: isExpanded ? $t('hide_schema') : $t('show_schema'),
  icon: mdiCodeJson,
  onAction: onToggle,
});

const handleDeleteWorkflow = async (workflow: WorkflowResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    prompt: $t('workflow_delete_prompt'),
    confirmColor: 'danger',
  });

  if (!confirmed) {
    return;
  }

  await executeMutation(deleteWorkflowMutation, [{ id: workflow.id }], {
    onSuccess: () => {
      if (page.params.workflowId === workflow.id) {
        void goto(Route.workflows());
      }
    },
  });
};
