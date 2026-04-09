<script lang="ts">
  export let assetId: string;
  export let description: string | undefined = undefined;
  export let confidence: number | undefined = undefined;
  export let isGenerating: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ generate: string; edit: { id: string; description: string } }>();

  let isEditing = false;
  let editText = description || '';

  function handleGenerate() {
    isGenerating = true;
    dispatch('generate', assetId);
  }

  function handleSave() {
    dispatch('edit', { id: assetId, description: editText });
    isEditing = false;
  }

  function handleCancel() {
    editText = description || '';
    isEditing = false;
  }

  $: editText = description || '';
</script>

<div class="ai-description-panel rounded-lg border border-gray-200 dark:border-gray-700 p-4">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      <span class="mr-1">🤖</span> AI Description
    </h3>
    {#if confidence !== undefined}
      <span class="text-xs px-2 py-0.5 rounded-full {confidence >= 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
        {Math.round(confidence * 100)}% confident
      </span>
    {/if}
  </div>

  {#if isEditing}
    <textarea
      bind:value={editText}
      class="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 resize-none"
      rows="3"
      placeholder="Edit description..."
    />
    <div class="flex gap-2 mt-2">
      <button
        on:click={handleSave}
        class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Save
      </button>
      <button
        on:click={handleCancel}
        class="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
      >
        Cancel
      </button>
    </div>
  {:else if description}
    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    <button
      on:click={() => (isEditing = true)}
      class="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
    >
      Edit
    </button>
  {:else}
    <div class="flex flex-col items-center gap-2 py-3">
      <p class="text-sm text-gray-500 dark:text-gray-500">No AI description yet</p>
      <button
        on:click={handleGenerate}
        disabled={isGenerating}
        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if isGenerating}
          <span class="inline-flex items-center gap-1">
            <span class="animate-spin">⚡</span> Generating...
          </span>
        {:else}
          ✨ Generate Description
        {/if}
      </button>
    </div>
  {/if}
</div>
