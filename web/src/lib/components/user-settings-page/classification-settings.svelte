<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import {
    Action2,
    createCategory,
    deleteCategory,
    getCategories,
    scanClassification,
    updateCategory,
    type ClassificationCategoryResponseDto,
  } from '@immich/sdk';
  import { Button, IconButton, Switch, Text, toastManager } from '@immich/ui';
  import { mdiContentSave, mdiDelete, mdiPencil, mdiPlus, mdiUndoVariant } from '@mdi/js';
  import { onMount } from 'svelte';

  let categories: ClassificationCategoryResponseDto[] = $state([]);
  let editingId: string | null = $state(null);
  let isCreating = $state(false);
  let isSaving = $state(false);
  let isScanning = $state(false);

  let formName = $state('');
  let formPrompts = $state('');
  let formSimilarity = $state(0.28);
  let formAction: Action2 = $state(Action2.Tag);
  let formEnabled = $state(true);

  const similarityLabels: Record<string, string> = {
    loose: 'Loose',
    normal: 'Normal',
    strict: 'Strict',
  };

  const getSimilarityLabel = (value: number): string => {
    if (value < 0.22) {
      return similarityLabels.loose;
    }
    if (value > 0.35) {
      return similarityLabels.strict;
    }
    return similarityLabels.normal;
  };

  const actionLabels: Record<Action2, string> = {
    [Action2.Tag]: 'Tag only',
    [Action2.TagAndArchive]: 'Tag and archive',
  };

  onMount(async () => {
    await refreshCategories();
  });

  const refreshCategories = async () => {
    try {
      categories = await getCategories();
    } catch (error) {
      handleError(error, 'Unable to load classification categories');
    }
  };

  const startCreate = () => {
    editingId = null;
    isCreating = true;
    formName = '';
    formPrompts = '';
    formSimilarity = 0.28;
    formAction = Action2.Tag;
    formEnabled = true;
  };

  const startEdit = (category: ClassificationCategoryResponseDto) => {
    isCreating = false;
    editingId = category.id;
    formName = category.name;
    formPrompts = category.prompts.join('\n');
    formSimilarity = category.similarity;
    formAction = category.action;
    formEnabled = category.enabled;
  };

  const cancelEdit = () => {
    editingId = null;
    isCreating = false;
  };

  const handleSave = async () => {
    isSaving = true;
    try {
      const prompts = formPrompts
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (isCreating) {
        await createCategory({
          classificationCategoryCreateDto: {
            name: formName,
            prompts,
            similarity: formSimilarity,
            action: formAction,
          },
        });
        toastManager.primary(`Category "${formName}" created`);
      } else if (editingId) {
        await updateCategory({
          id: editingId,
          classificationCategoryUpdateDto: {
            name: formName,
            prompts,
            similarity: formSimilarity,
            action: formAction,
            enabled: formEnabled,
          },
        });
        toastManager.primary(`Category "${formName}" updated`);
      }
      cancelEdit();
      await refreshCategories();
    } catch (error) {
      handleError(error, 'Unable to save category');
    } finally {
      isSaving = false;
    }
  };

  const handleDelete = async (category: ClassificationCategoryResponseDto) => {
    try {
      await deleteCategory({ id: category.id });
      toastManager.primary(`Category "${category.name}" deleted`);
      await refreshCategories();
    } catch (error) {
      handleError(error, 'Unable to delete category');
    }
  };

  const handleToggleEnabled = async (category: ClassificationCategoryResponseDto) => {
    try {
      await updateCategory({
        id: category.id,
        classificationCategoryUpdateDto: { enabled: !category.enabled },
      });
      await refreshCategories();
    } catch (error) {
      handleError(error, 'Unable to toggle category');
    }
  };

  const handleScan = async () => {
    isScanning = true;
    try {
      await scanClassification();
      toastManager.primary('Library scan started');
    } catch (error) {
      handleError(error, 'Unable to start library scan');
    } finally {
      isScanning = false;
    }
  };
</script>

<section class="my-4">
  {#if isCreating || editingId}
    <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 p-5">
      <Text fontWeight="semi-bold" class="mb-4">{isCreating ? 'New Category' : 'Edit Category'}</Text>

      <div class="flex flex-col gap-4">
        <div>
          <label for="category-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label
          >
          <input
            id="category-name"
            type="text"
            bind:value={formName}
            placeholder="e.g. Screenshots, Receipts, Memes"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-immich-primary focus:outline-none"
          />
        </div>

        <div>
          <label for="category-prompts" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prompts (one per line)
          </label>
          <textarea
            id="category-prompts"
            bind:value={formPrompts}
            rows="4"
            placeholder="a screenshot of a phone&#10;a screenshot of a computer&#10;a screen capture"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-immich-primary focus:outline-none resize-y"
          ></textarea>
        </div>

        <div>
          <label for="category-similarity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Similarity: {formSimilarity.toFixed(2)} ({getSimilarityLabel(formSimilarity)})
          </label>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500 dark:text-gray-400">Loose</span>
            <input
              id="category-similarity"
              type="range"
              min="0.15"
              max="0.45"
              step="0.01"
              bind:value={formSimilarity}
              class="flex-1"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">Strict</span>
          </div>
        </div>

        <div>
          <label for="category-action" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Action
          </label>
          <select
            id="category-action"
            bind:value={formAction}
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-immich-primary focus:outline-none"
          >
            {#each Object.values(Action2) as action (action)}
              <option value={action}>{actionLabels[action]}</option>
            {/each}
          </select>
        </div>

        {#if editingId}
          <div class="flex items-center gap-2">
            <Switch bind:checked={formEnabled} />
            <Text size="small">{formEnabled ? 'Enabled' : 'Disabled'}</Text>
          </div>
        {/if}

        <div class="flex justify-end gap-2">
          <Button shape="round" size="small" color="secondary" onclick={cancelEdit} leadingIcon={mdiUndoVariant}>
            Cancel
          </Button>
          <Button
            shape="round"
            size="small"
            onclick={handleSave}
            disabled={isSaving || !formName.trim() || !formPrompts.trim()}
            leadingIcon={mdiContentSave}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  {/if}

  {#if categories.length > 0}
    {#each categories as category (category.id)}
      <div
        class="rounded-2xl border border-gray-200 dark:border-gray-800 mt-4 bg-slate-50 dark:bg-gray-900 p-4"
        class:opacity-50={!category.enabled}
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <Text fontWeight="medium">{category.name}</Text>
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                    {category.action === Action2.TagAndArchive
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}"
                >
                  {actionLabels[category.action]}
                </span>
              </div>
              <Text size="tiny" color="muted">
                {category.prompts.length} prompt{category.prompts.length === 1 ? '' : 's'} &middot; {getSimilarityLabel(
                  category.similarity,
                )}
                ({category.similarity.toFixed(2)})
              </Text>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Switch checked={category.enabled} onCheckedChange={() => handleToggleEnabled(category)} />
            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              icon={mdiPencil}
              size="small"
              onclick={() => startEdit(category)}
              aria-label="Edit"
            />
            <IconButton
              shape="round"
              color="secondary"
              variant="ghost"
              icon={mdiDelete}
              size="small"
              onclick={() => handleDelete(category)}
              aria-label="Delete"
            />
          </div>
        </div>
      </div>
    {/each}
  {:else if !isCreating}
    <Text class="py-4" color="muted">No classification categories yet. Add one to get started.</Text>
  {/if}

  <div class="flex justify-end gap-2 mt-5">
    <Button shape="round" size="small" color="secondary" onclick={handleScan} disabled={isScanning}>
      {isScanning ? 'Scanning...' : 'Scan Library'}
    </Button>
    {#if !isCreating && !editingId}
      <Button shape="round" size="small" onclick={startCreate} leadingIcon={mdiPlus}>Add Category</Button>
    {/if}
  </div>
</section>
