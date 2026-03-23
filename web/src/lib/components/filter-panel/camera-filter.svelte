<script lang="ts">
  interface Props {
    makes: string[];
    selectedMake?: string;
    selectedModel?: string;
    onModelFetch: (make: string) => Promise<string[]>;
    onSelectionChange: (make?: string, model?: string) => void;
  }

  let { makes, selectedMake, selectedModel, onModelFetch, onSelectionChange }: Props = $props();

  let expandedMake = $state<string | undefined>(undefined);
  let models = $state<string[]>([]);
  let loadingModels = $state(false);

  $effect(() => {
    if (expandedMake) {
      loadingModels = true;
      void onModelFetch(expandedMake).then((result) => {
        models = result;
        loadingModels = false;
      });
    } else {
      models = [];
    }
  });

  function handleMakeClick(make: string) {
    if (selectedMake === make && !selectedModel) {
      // Deselect make
      expandedMake = undefined;
      onSelectionChange(undefined, undefined);
    } else {
      // Select make
      expandedMake = make;
      onSelectionChange(make, undefined);
    }
  }

  function handleModelClick(model: string, make: string) {
    if (selectedModel === model) {
      // Deselect model, keep make
      onSelectionChange(make, undefined);
    } else {
      // Select model (auto-fills make)
      onSelectionChange(make, model);
    }
  }
</script>

<div data-testid="camera-filter">
  {#if makes.length === 0}
    <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="camera-empty">No cameras in this space</p>
  {:else}
    {#each makes as make (make)}
      {@const isMakeSelected = selectedMake === make}
      <!-- Make row -->
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isMakeSelected
          ? 'font-medium'
          : 'text-gray-500 dark:text-gray-300'}"
        onclick={() => handleMakeClick(make)}
        data-testid="camera-make-{make}"
      >
        <!-- Radio indicator -->
        <div
          class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isMakeSelected &&
          !selectedModel
            ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
            : 'border-gray-300 dark:border-gray-600'}"
        >
          {#if isMakeSelected && !selectedModel}
            <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
          {/if}
        </div>

        <!-- Label -->
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{make}</span>
      </button>

      <!-- Models (indented when make is expanded) -->
      {#if expandedMake === make && !loadingModels}
        {#each models as model (model)}
          {@const isModelSelected = selectedModel === model && selectedMake === make}
          <button
            type="button"
            class="-mx-2 ml-5 flex w-[calc(100%-1.25rem+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isModelSelected
              ? 'font-medium'
              : 'text-gray-500 dark:text-gray-300'}"
            onclick={() => handleModelClick(model, make)}
            data-testid="camera-model-{model}"
          >
            <!-- Radio indicator -->
            <div
              class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isModelSelected
                ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
                : 'border-gray-300 dark:border-gray-600'}"
            >
              {#if isModelSelected}
                <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
              {/if}
            </div>

            <!-- Label -->
            <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{model}</span>
          </button>
        {/each}
      {/if}
    {/each}
  {/if}
</div>
