import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowForShare,
  getWorkflowTriggers,
  searchWorkflows,
  updateWorkflow,
  type WorkflowResponseDto,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';
import { asMutation, queryClient } from '$lib/queries/client';

const findOrFail = (workflows: WorkflowResponseDto[], id: string) => {
  const workflow = workflows.find((workflow) => workflow.id === id);
  if (!workflow) {
    throw new Error(`Workflow ${id} not found`);
  }
  return workflow;
};

export const searchWorkflowsQuery = () =>
  queryOptions({
    queryKey: ['workflows'],
    queryFn: ({ signal }) => searchWorkflows({}, { signal }),
  });

export const getWorkflowQuery = (id: string) =>
  queryOptions({
    ...searchWorkflowsQuery(),
    select: (workflows) => findOrFail(workflows, id),
  });

export const getWorkflowForShareQuery = (id: string) =>
  queryOptions({
    queryKey: ['workflows', id, 'share'],
    queryFn: ({ signal }) => getWorkflowForShare({ id }, { signal }),
    staleTime: 0,
  });

export const getWorkflowTriggersQuery = () =>
  queryOptions({
    queryKey: ['workflows', 'triggers'],
    queryFn: ({ signal }) => getWorkflowTriggers({ signal }),
  });

export const createWorkflowMutation = () =>
  asMutation(createWorkflow, {
    onSuccess: (workflow) =>
      queryClient.setQueryData(searchWorkflowsQuery().queryKey, (workflows) =>
        workflows ? [...workflows, workflow] : workflows,
      ),
    meta: { success: { toast: true }, error: { toast: 'errors.unable_to_create' } },
  });

export const updateWorkflowMutation = () =>
  asMutation(updateWorkflow, {
    onSuccess: (workflow) =>
      queryClient.setQueryData(searchWorkflowsQuery().queryKey, (workflows) =>
        workflows?.map((item) => (item.id === workflow.id ? workflow : item)),
      ),
    meta: { success: { toast: 'workflow_update_success' }, error: { toast: 'errors.unable_to_update_workflow' } },
  });

export const deleteWorkflowMutation = () =>
  asMutation(deleteWorkflow, {
    onSuccess: (_, [{ id }]) => {
      queryClient.setQueryData(searchWorkflowsQuery().queryKey, (workflows) =>
        workflows?.filter((workflow) => workflow.id !== id),
      );
      queryClient.removeQueries({ queryKey: getWorkflowForShareQuery(id).queryKey });
    },
    meta: { success: { toast: 'workflow_deleted' }, error: { toast: 'errors.unable_to_delete_workflow' } },
  });
