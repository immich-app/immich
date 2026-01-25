import FilterTool from '$lib/components/asset-viewer/editor/filter-tool/filter-tool.svelte';
import TransformTool from '$lib/components/asset-viewer/editor/transform-tool/transform-tool.svelte';
import { filterManager } from '$lib/managers/edit/filter-manager.svelte';
import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { waitForWebsocketEvent } from '$lib/stores/websocket';
import { getFormatter } from '$lib/utils/i18n';
import { editAsset, removeAssetEdits, type AssetEditsDto, type AssetResponseDto } from '@immich/sdk';
import { ConfirmModal, modalManager, toastManager, type MaybePromise } from '@immich/ui';
import { mdiCropRotate, mdiPalette } from '@mdi/js';
import type { Component } from 'svelte';

export type EditAction = AssetEditsDto['edits'][number];
export type EditActions = EditAction[];

export interface EditToolManager {
  onActivate: (asset: AssetResponseDto, edits: EditActions) => MaybePromise<void>;
  onDeactivate: () => MaybePromise<void>;
  resetAllChanges: () => MaybePromise<void>;
  hasChanges: boolean;
  canReset: boolean;
  edits: EditAction[];
}

export enum EditToolType {
  Transform = 'transform',
  Filter = 'filter',
}

export interface EditTool {
  type: EditToolType;
  icon: string;
  component: Component;
  manager: EditToolManager;
}

export class EditManager {
  tools: EditTool[] = [
    {
      type: EditToolType.Transform,
      icon: mdiCropRotate,
      component: TransformTool,
      manager: transformManager,
    },
    {
      type: EditToolType.Filter,
      icon: mdiPalette,
      component: FilterTool,
      manager: filterManager,
    },
  ];

  currentAsset = $state<AssetResponseDto | null>(null);
  selectedTool = $state<EditTool | null>(null);

  // used to disable multiple confirm dialogs and mouse events while one is open
  isShowingConfirmDialog = $state(false);
  isApplyingEdits = $state(false);
  hasAppliedEdits = $state(false);

  hasUnsavedChanges = $derived(this.tools.some((t) => t.manager.hasChanges) && !this.hasAppliedEdits);
  canReset = $derived(this.tools.some((t) => t.manager.canReset));

  async closeConfirm(): Promise<boolean> {
    // Prevent multiple dialogs (usually happens with rapid escape key presses)
    if (this.isShowingConfirmDialog) {
      return false;
    }

    if (!this.hasUnsavedChanges) {
      return true;
    }

    this.isShowingConfirmDialog = true;

    const t = await getFormatter();

    const confirmed = await modalManager.show(ConfirmModal, {
      title: t('editor_discard_edits_title'),
      prompt: t('editor_discard_edits_prompt'),
      confirmText: t('editor_discard_edits_confirm'),
    });

    this.isShowingConfirmDialog = false;

    return confirmed;
  }

  async reset() {
    for (const tool of this.tools) {
      await tool.manager.onDeactivate?.();
    }
    this.selectedTool = this.tools[0];
  }

  async init(asset: AssetResponseDto, edits: AssetEditsDto) {
    this.currentAsset = asset;

    for (const tool of this.tools) {
      await tool.manager.onActivate?.(asset, edits.edits);
    }
    this.selectedTool = this.tools[0];
  }

  activateTool(toolType: EditToolType) {
    const newTool = this.tools.find((t) => t.type === toolType);
    if (newTool) {
      this.selectedTool = newTool;
    }
  }

  async cleanup() {
    for (const tool of this.tools) {
      await tool.manager.onDeactivate?.();
    }
    this.currentAsset = null;
    this.selectedTool = null;
  }

  async resetAllChanges() {
    for (const tool of this.tools) {
      await tool.manager.resetAllChanges();
    }
  }

  async applyEdits(): Promise<boolean> {
    this.isApplyingEdits = true;

    const edits = this.tools.flatMap((tool) => tool.manager.edits);
    if (!this.currentAsset) {
      return false;
    }

    const assetId = this.currentAsset.id;
    const t = await getFormatter();

    try {
      // Setup the websocket listener before sending the edit request
      const editCompleted = waitForWebsocketEvent('AssetEditReadyV1', (event) => event.asset.id === assetId, 10_000);

      await (edits.length === 0
        ? removeAssetEdits({ id: assetId })
        : editAsset({
            id: assetId,
            assetEditActionListDto: {
              edits,
            },
          }));

      await editCompleted;

      eventManager.emit('AssetEditsApplied', assetId);

      toastManager.success(t('editor_edits_applied_success'));
      this.hasAppliedEdits = true;

      return true;
    } catch {
      toastManager.danger(t('editor_edits_applied_error'));
      return false;
    } finally {
      this.isApplyingEdits = false;
    }
  }
}

export const editManager = new EditManager();
