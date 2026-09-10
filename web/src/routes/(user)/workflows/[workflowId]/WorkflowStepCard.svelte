<script module lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAlbumInfo, getTagById } from '@immich/sdk';

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const albumNameCache = new Map<string, Promise<string>>();
  const getAlbumName = (id: string): Promise<string> => {
    let albumName = albumNameCache.get(id);
    if (!albumName) {
      albumName = getAlbumInfo({ ...authManager.params, id })
        .then((album) => album.albumName)
        .catch(() => id);
      albumNameCache.set(id, albumName);
    }
    return albumName;
  };
</script>

<script lang="ts">
  import { pluginManager } from '$lib/managers/plugin-manager.svelte';
  import type { JSONSchemaProperty } from '$lib/types';
  import { type WorkflowStepDto } from '@immich/sdk';
  import { Badge, Card, CardBody, CardDescription, CardHeader, CardTitle, Icon, IconButton } from '@immich/ui';
  import {
    mdiAutoFix,
    mdiDragVertical,
    mdiFilterVariant,
    mdiPencilOutline,
    mdiPlus,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { mount } from 'svelte';
  import { t } from 'svelte-i18n';
  import WorkflowStepDragImage from './WorkflowStepDragImage.svelte';

  type Props = {
    step: WorkflowStepDto & { id: string };
    index: number;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    onInsertBefore: (index: number) => void;
    onDragOver: (index: number, event: DragEvent, boundingRect: DOMRect) => void;
    onDrop: (event: DragEvent) => void;
    onDragEnd: (event: DragEvent) => void;
    onDragStart: (event: DragEvent) => void;
  };

  let { step, index, onEdit, onDelete, onInsertBefore, onDragOver, onDrop, onDragEnd, onDragStart }: Props = $props();

  const method = $derived(pluginManager.getMethod(step.method));
  const isFilter = $derived(method?.uiHints?.includes('Filter') ?? false);
  const schema = $derived(method?.schema as JSONSchemaProperty | undefined);
  const configEntries = $derived(
    Object.entries(step.config ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  );
  const isGhost = $derived(step.id === 'ghost');

  const getUiHint = (key: string) => schema?.properties?.[key]?.uiHint?.type;
  const toIds = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : [String(value)]);
  let dragImage = $state<Element>();
  let isDropTarget = $state(false);

  const truncate = (input: string, max = 24) => (input.length > max ? input.slice(0, max - 1) + '…' : input);

  const formatConfigValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'boolean') {
      return value ? 'on' : 'off';
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') {
      return `"${truncate(value)}"`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return $t('none');
      }
      const items = value.map((v) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v)));
      const joined = items.join(' · ');
      if (joined.length <= 28) {
        return `"${joined}"`;
      }
      return $t('items_count', { values: { count: value.length } });
    }
    return JSON.stringify(value);
  };

  const handleDragStart = (index: number, event: DragEvent) => {
    if (!event.dataTransfer) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', step.id);

    mount(WorkflowStepDragImage, {
      target: document.body,
      props: {
        description: method?.description,
        isFilter: method?.uiHints?.includes('Filter') ?? false,
        label: step ? pluginManager.getMethodLabel(step.method) : '',
        stepNumber: index + 1,
      },
    });

    dragImage = document.body.querySelector('#workflow-step-drag-image')!;
    event.dataTransfer.setDragImage(dragImage, 16, 22);
    onDragStart(event);
  };

  const handleDragOver = (event: DragEvent & { currentTarget: HTMLElement }) => {
    event.preventDefault();
    if (isGhost) {
      return;
    }
    isDropTarget = true;
    onDragOver(index, event, event.currentTarget.getBoundingClientRect());
  };

  const handleDragEnd = (event: DragEvent) => {
    dragImage?.remove();
    dragImage = undefined;
    isDropTarget = false;
    onDragEnd(event);
  };
</script>

<div class="group/step-row flex w-full flex-col">
  <div class="-mt-4 ml-18 flex w-full items-center gap-4">
    <div class="relative flex w-1 shrink-0 justify-start">
      <div class="h-10 w-0.5 bg-light-200"></div>
      <button
        type="button"
        class="absolute top-1/2 left-1/2 z-10 -translate-1/2 cursor-pointer rounded-full border border-dashed border-primary-200 bg-light p-0.5 text-primary opacity-0 transition-opacity group-hover/step-row:opacity-100 hover:bg-primary-50"
        aria-label={$t('add_step')}
        title={$t('add_step')}
        onclick={() => onInsertBefore(index)}
      >
        <Icon icon={mdiPlus} size="14" />
      </button>
    </div>
  </div>

  <div
    class="w-full transition-all"
    class:opacity-40={!!dragImage}
    class:scale-[0.99]={!!dragImage}
    ondragover={handleDragOver}
    ondragleave={() => (isDropTarget = false)}
    ondrop={onDrop}
    role="listitem"
  >
    <Card
      class="shadow-none transition-colors {isDropTarget
        ? 'border-primary ring-2 ring-primary-200'
        : isGhost
          ? 'border-dashed border-primary'
          : ''}"
    >
      <CardHeader>
        <div class="flex items-center gap-2">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="flex shrink-0 cursor-grab items-center justify-center rounded-md border border-transparent p-1 text-light-400 select-none hover:border-primary-200 hover:bg-primary-50 hover:text-primary active:cursor-grabbing"
            aria-label={$t('drag_to_reorder')}
            draggable="true"
            ondragstart={(event) => handleDragStart(index, event)}
            ondragend={handleDragEnd}
            title={$t('drag_to_reorder')}
          >
            <Icon icon={mdiDragVertical} size="20" />
          </div>
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg"
            class:bg-primary-50={isFilter}
            class:bg-warning-50={!isFilter}
          >
            <Icon
              icon={isFilter ? mdiFilterVariant : mdiAutoFix}
              size="20"
              class={isFilter ? 'text-primary' : 'text-warning'}
            />
          </div>
          <div class="flex min-w-0 flex-1 flex-col">
            <CardTitle class="truncate">
              <span class="mr-1 font-bold text-light-500">{index + 1}</span>
              {pluginManager.getMethodLabel(step.method)}
            </CardTitle>
            {#if method?.description}
              <CardDescription class="truncate">{method.description}</CardDescription>
            {/if}
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <IconButton
              icon={mdiPencilOutline}
              aria-label={$t('edit')}
              variant="ghost"
              shape="round"
              color="secondary"
              size="small"
              onclick={() => onEdit(index)}
            />
            <IconButton
              icon={mdiTrashCanOutline}
              aria-label={$t('delete')}
              variant="ghost"
              shape="round"
              color="danger"
              size="small"
              onclick={() => onDelete(index)}
            />
          </div>
        </div>
      </CardHeader>

      {#if configEntries.length > 0}
        <CardBody class="py-3">
          <div class="flex flex-wrap items-center gap-1.5">
            {#snippet badge(key: string, content: string)}
              <Badge
                color={isFilter ? 'info' : 'warning'}
                shape="round"
                size="small"
                class="border font-mono {isFilter ? 'border-primary-200' : 'border-warning-200'}"
              >
                <span class="opacity-60">{key}</span>{content}
              </Badge>
            {/snippet}
            {#each configEntries as [key, value] (key)}
              {#if getUiHint(key) === 'AlbumId'}
                {#each toIds(value) as albumId (albumId)}
                  {#await getAlbumName(albumId)}
                    {@render badge($t('album'), '…')}
                  {:then albumName}
                    {@render badge($t('album'), `"${truncate(albumName)}"`)}
                  {/await}
                {/each}
              {:else if getUiHint(key) === 'TagId'}
                {#each toIds(value) as tagId (tagId)}
                  {#await getTagById({ id: tagId })}
                    {@render badge($t('tag'), '…')}
                  {:then tag}
                    {@render badge($t('tag'), `"${truncate(tag.name)}"`)}
                  {:catch}
                    {@render badge($t('tag'), `"${truncate(tagId)}"`)}
                  {/await}
                {/each}
              {:else}
                {@render badge(key, formatConfigValue(value))}
              {/if}
            {/each}
          </div>
        </CardBody>
      {/if}
    </Card>
  </div>
</div>
