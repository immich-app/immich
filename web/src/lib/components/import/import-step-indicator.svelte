<script lang="ts">
  import { ImportStep } from '$lib/managers/import-manager.svelte';
  import { Icon } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { t, type Translations } from 'svelte-i18n';

  interface Props {
    currentStep: ImportStep;
  }

  let { currentStep }: Props = $props();

  const steps: Array<{ index: ImportStep; label: Translations }> = [
    { index: ImportStep.Source, label: 'import_step_source' as Translations },
    { index: ImportStep.Files, label: 'import_step_files' as Translations },
    { index: ImportStep.Scan, label: 'import_step_scan' as Translations },
    { index: ImportStep.Review, label: 'import_step_review' as Translations },
    { index: ImportStep.Import, label: 'import_step_import' as Translations },
  ];
</script>

<div class="flex items-center justify-center gap-0">
  {#each steps as step, i (step.index)}
    {#if i > 0}
      <div class="h-0.5 w-8 sm:w-12 {step.index <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}"></div>
    {/if}
    <div
      class="flex flex-col items-center gap-1"
      data-testid="step-{step.index}"
      data-completed={step.index < currentStep ? 'true' : 'false'}
    >
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium {step.index === currentStep
          ? 'bg-primary text-white'
          : step.index < currentStep
            ? 'bg-primary/20 text-primary'
            : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}"
      >
        {#if step.index < currentStep}
          <Icon icon={mdiCheck} size="18" />
        {:else}
          {step.index + 1}
        {/if}
      </div>
      <span
        class="text-xs {step.index === currentStep
          ? 'font-medium text-primary'
          : step.index < currentStep
            ? 'text-primary'
            : 'text-gray-400 dark:text-gray-500'}"
      >
        {$t(step.label)}
      </span>
    </div>
  {/each}
</div>
