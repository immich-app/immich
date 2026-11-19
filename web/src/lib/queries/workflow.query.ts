import { workflowLogsPageSize } from '#lib/constants.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowForShare,
  getWorkflowLogs,
  getWorkflowTriggers,
  searchWorkflows,
  updateWorkflow,
  type WorkflowResponseDto,
  type WorkflowResult,
} from '@immich/sdk';
import { infiniteQueryOptions, queryOptions } from '@tanstack/svelte-query';

const findOrFail = (workflows: WorkflowResponseDto[], id: string) => {
  const workflow = workflows.find((workflow) => workflow.id === id);
  if (!workflow) {
    throw new Error(`Workflow ${id} not found`);
  }
  return workflow;
};

export const searchWorkflowsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.workflows(),
    queryFn: ({ signal }) => searchWorkflows({}, { signal }),
  });

export const getWorkflowQuery = (id: string) =>
  queryOptions({
    ...searchWorkflowsQuery(),
    select: (workflows) => findOrFail(workflows, id),
  });

export const getWorkflowForShareQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.workflowShare({ id }),
    queryFn: ({ signal }) => getWorkflowForShare({ id }, { signal }),
  });

export const getWorkflowTriggersQuery = () =>
  queryOptions({
    queryKey: QueryKeys.workflowTriggers(),
    queryFn: ({ signal }) => getWorkflowTriggers({ signal }),
  });

export const getWorkflowLogsQuery = (id: string, result?: WorkflowResult) =>
  infiniteQueryOptions({
    queryKey: QueryKeys.workflowLogs({ id, result }),
    queryFn: ({ pageParam: before, signal }) =>
      getWorkflowLogs({ id, result, before, limit: workflowLogsPageSize }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (entries) => (entries.length < workflowLogsPageSize ? undefined : entries.at(-1)?.at),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
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
      queryClient.removeQueries({ queryKey: QueryKeys.workflowShare({ id }) });
    },
    meta: { success: { toast: 'workflow_deleted' }, error: { toast: 'errors.unable_to_delete_workflow' } },
  });
