<script lang="ts">
  import { type WorkflowLogEntryDto, type WorkflowResponseDto, WorkflowResult, getWorkflowLogs } from '@immich/sdk';
  import {
    Modal,
    ModalBody,
    Table,
    TableHeader,
    TableHeading,
    TableBody,
    TableRow,
    TableCell,
    HStack,
    Icon,
    VStack,
    Button,
    Select,
    type SelectOption,
  } from '@immich/ui';
  import { mdiHistory, mdiOpenInNew } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { locale } from '$lib/stores/preferences.store';
  import { DateTime } from 'luxon';
  import { Route } from '$lib/route';
  import { handleUpdateWorkflow } from '$lib/services/workflow.service';

  type Props = {
    workflow: WorkflowResponseDto;
    onClose: () => void;
  };

  let { workflow, onClose }: Props = $props();

  let entries: WorkflowLogEntryDto[] = $state([]);
  let placeholder: HTMLElement | undefined = $state();
  let filter: WorkflowResult | undefined = $state();
  let before: string | undefined = $state();
  let hasNext = $state(true);
  let loading = $state(false);

  const setLogging = (logging: boolean) =>
    handleUpdateWorkflow(workflow.id, { logging }).then((success) => {
      if (success) {
        workflow = { ...workflow, logging };
        reset();
      }
    });

  const reset = () => {
    entries = [];
    hasNext = true;
    before = undefined;
  };

  const setFilter = (option: SelectOption<WorkflowResult>) => {
    reset();
    filter = option.value;
    void getLogs();
  };

  const getLogs = async () => {
    if (!hasNext || loading) {
      return;
    }

    loading = true;
    const limit = 50;
    const results = await getWorkflowLogs({ id: workflow.id, result: filter, before, limit });
    entries.push(...results);
    if (results.length < limit) {
      hasNext = false;
    } else {
      before = results.at(-1)?.at;
    }
    loading = false;
  };

  const observer = new IntersectionObserver((entries) => {
    const entry = entries.find((entry) => entry.target === placeholder);
    if (entry?.isIntersecting) {
      void getLogs();
    }
  });

  $effect(() => {
    if (placeholder) {
      observer.disconnect();
      observer.observe(placeholder);
    }
  });
</script>

<Modal title={$t('logs')} icon={mdiHistory} {onClose} size="medium">
  <ModalBody>
    {#if workflow.logging}
      <Table striped>
        <TableHeader>
          <TableHeading>{$t('date')}</TableHeading>
          <TableHeading>{$t('result')}</TableHeading>
        </TableHeader>
        <TableBody class="max-h-100">
          {#each entries as entry}
            <TableRow>
              <TableCell>
                <HStack class="justify-center">
                  <p>
                    {DateTime.fromISO(entry.at).toLocaleString(DateTime.DATETIME_MED, {
                      locale: $locale,
                    })}
                  </p>
                  {#if entry.triggerDataId}
                    <a href={Route.viewAsset({ id: entry.triggerDataId })} target="_blank">
                      <Icon icon={mdiOpenInNew} size="20" class="text-primary" />
                    </a>
                  {/if}
                </HStack>
              </TableCell>
              <TableCell>
                <HStack class="justify-center">
                  {#if entry.result === WorkflowResult.Completed}
                    <p class="rounded-full bg-green-700 px-3 py-1 text-xs text-white">
                      {$t('workflow_logging_completed')}
                    </p>
                  {:else if entry.result === WorkflowResult.Halted}
                    <p class="rounded-full bg-gray-600 px-3 py-1 text-xs text-white">
                      {#if entry.lastStep}
                        {$t('workflow_logging_halted_step', { values: { step: entry.lastStep.index + 1 } })}
                      {:else}
                        {$t('workflow_logging_halted')}
                      {/if}
                    </p>
                  {:else}
                    <p class="rounded-full bg-red-500 px-3 py-1 text-xs text-white">
                      {#if entry.lastStep}
                        {$t('workflow_logging_error_step', { values: { step: entry.lastStep.index + 1 } })}
                      {:else}
                        {$t('error')}
                      {/if}
                    </p>
                  {/if}
                </HStack>
              </TableCell>
            </TableRow>
          {/each}
          {#if hasNext}
            <TableRow><TableCell><div bind:this={placeholder}>...</div></TableCell></TableRow>
          {/if}
        </TableBody>
      </Table>
      <div class="mt-5 flex gap-5">
        <Select
          onSelect={setFilter}
          class="flex-1"
          placeholder={$t('filter')}
          options={[
            { value: WorkflowResult.Completed, label: $t('workflow_logging_completed') },
            { value: WorkflowResult.Halted, label: $t('workflow_logging_halted') },
            { value: WorkflowResult.Error, label: $t('error') },
          ]}
        />
        <Button class="flex-1" onclick={() => setLogging(false)}>{$t('workflow_logging_disable')}</Button>
      </div>
    {:else}
      <VStack class="gap-5 py-5">
        <p class="text-md text-center">{$t('workflow_logging_disabled_description')}</p>
        <Button onclick={() => setLogging(true)}>{$t('workflow_logging_enable')}</Button>
      </VStack>
    {/if}
  </ModalBody>
</Modal>
