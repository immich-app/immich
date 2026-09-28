<script lang="ts">
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import { getTriggerName } from '$lib/utils/workflow';
  import type { WorkflowStepDto, WorkflowTrigger } from '@immich/sdk';
  import { Icon, IconButton, shortcut, Text } from '@immich/ui';
  import { mdiCheck, mdiClose, mdiContentCopy, mdiViewDashboardOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  type Props = {
    workflow: {
      name: string | null;
      description: string | null;
      trigger: WorkflowTrigger;
      steps: WorkflowStepDto[];
    };
  };

  let { workflow }: Props = $props();

  let isOpen = $state(false);
  let justCopied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const formatConfigValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }
      return '[' + value.map((v) => (v !== null && typeof v === 'object' ? '{…}' : String(v))).join(', ') + ']';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getConfigEntries = (config: WorkflowStepDto['config']) =>
    Object.entries(config ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '');

  const asciiSummary = $derived.by(() => {
    const lines: string[] = [];
    const title = workflow.name ?? $t('no_name');
    lines.push(title);
    if (workflow.description) {
      lines.push(workflow.description);
    }

    lines.push('', '  WHEN', `    ⚡ ${getTriggerName($t, workflow.trigger)}`, '', '  THEN');

    if (workflow.steps.length === 0) {
      lines.push(`    ${$t('no_steps')}`);
      return lines.join('\n');
    }

    for (const [i, step] of workflow.steps.entries()) {
      const method = pluginManager.getMethod(step.method);
      const isFilter = method?.uiHints?.includes('Filter') ?? false;
      const type = isFilter ? $t('filter') : $t('action');
      const label = pluginManager.getMethodLabel(step.method);
      lines.push(`    [${i + 1}] ${type.toUpperCase()} · ${label}`);
      for (const [key, value] of getConfigEntries(step.config)) {
        lines.push(`          ${key} = ${formatConfigValue(value)}`);
      }
      if (i < workflow.steps.length - 1) {
        lines.push('');
      }
    }

    return lines.join('\n');
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(asciiSummary);
      justCopied = true;
      if (copyTimer) {
        clearTimeout(copyTimer);
      }
      copyTimer = setTimeout(() => (justCopied = false), 1500);
    } catch {
      // ignore — clipboard may be unavailable
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: () => (isOpen = false) }} />

{#if isOpen}
  <aside
    class="fixed inset-y-20 right-4 bottom-4 hidden max-w-lg flex-col overflow-hidden rounded-2xl border border-light-200 bg-light shadow-2xl sm:flex"
    transition:fly={{ x: 400, duration: 250 }}
    aria-label={$t('workflow_summary')}
  >
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b border-light-200 px-4 py-2.5">
      <Text size="small" fontWeight="semi-bold" color="muted">{$t('workflow_summary')}</Text>
      <div class="flex items-center gap-1">
        <IconButton
          icon={justCopied ? mdiCheck : mdiContentCopy}
          size="small"
          variant="ghost"
          color={justCopied ? 'success' : 'secondary'}
          title={$t('copy_to_clipboard')}
          aria-label={$t('copy_to_clipboard')}
          onclick={handleCopy}
        />
        <IconButton
          icon={mdiClose}
          size="small"
          variant="ghost"
          color="secondary"
          title="Close summary"
          aria-label="Close summary"
          onclick={() => (isOpen = false)}
        />
      </div>
    </div>

    <!-- ASCII body — what you see is what you copy -->
    <div class="flex-1 overflow-auto p-4">
      <pre
        class="m-0 overflow-auto rounded-lg border border-light-200 bg-light-100 px-4 py-3 font-mono text-xs/relaxed whitespace-pre">{asciiSummary}</pre>
    </div>
  </aside>
{:else}
  <button
    type="button"
    class="fixed right-6 bottom-6 hidden size-14 items-center justify-center rounded-full bg-primary text-light shadow-lg transition-colors hover:bg-primary/90 sm:flex"
    title={$t('workflow_summary')}
    aria-label={$t('workflow_summary')}
    onclick={() => (isOpen = true)}
  >
    <Icon icon={mdiViewDashboardOutline} size="24" />
  </button>
{/if}
