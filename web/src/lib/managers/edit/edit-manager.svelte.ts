import CropTool from '$lib/components/asset-viewer/editor/crop-tool/crop-tool.svelte';
import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
import { waitForWebsocketEvent } from '$lib/stores/websocket';
import { editAsset, type AssetEditsDto, type AssetResponseDto } from '@immich/sdk';
import { ConfirmModal, modalManager, toastManager } from '@immich/ui';
import { mdiCropRotate } from '@mdi/js';
import type { Component } from 'svelte';

export type EditAction = AssetEditsDto['edits'][number];
export type EditActions = EditAction[];
export type EditActionNoIndex = Omit<AssetEditsDto['edits'][number], 'index'>;

export interface EditToolManager {
  onActivate: (asset: AssetResponseDto, edits: EditActions) => void;
  onDeactivate: () => void;
  resetAllChanges: () => Promise<void>;
  hasChanges: boolean;
  edits: EditActionNoIndex[];
}

export enum EditToolType {
  Transform = 'transform',
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
      component: CropTool,
      manager: transformManager,
    },
  ];

  currentAsset = $state<AssetResponseDto | null>(null);
  selectedTool = $state<EditTool | null>(null);
  hasChanges = $derived(this.tools.some((t) => t.manager.hasChanges));

  // used to disable multiple confirm dialogs and mouse events while one is open
  isShowingConfirmDialog = $state(false);
  isApplyingEdits = $state(false);
  hasAppliedEdits = $state(false);

  async closeConfirm(): Promise<boolean> {
    // Prevent multiple dialogs (usually happens with rapid escape key presses)
    if (this.isShowingConfirmDialog) return false;
    if (!this.hasChanges || this.hasAppliedEdits) return true;

    this.isShowingConfirmDialog = true;

    const confirmed = await modalManager.show(ConfirmModal, {
      title: 'Discard Edits?',
      prompt: 'You have unsaved edits. Are you sure you want to discard them?',
      confirmText: 'Discard Edits',
    });

    this.isShowingConfirmDialog = false;

    return confirmed;
  }

  async reset() {
    for (const tool of this.tools) {
      tool.manager.onDeactivate?.();
    }
    this.selectedTool = this.tools[0];
  }

  async activateTool(toolType: EditToolType, asset: AssetResponseDto, edits: AssetEditsDto) {
    this.hasAppliedEdits = false;
    if (this.selectedTool?.type === toolType) {
      return;
    }

    this.currentAsset = asset;

    this.selectedTool?.manager.onDeactivate?.();
    const newTool = this.tools.find((t) => t.type === toolType);
    if (newTool) {
      this.selectedTool = newTool;
      newTool.manager.onActivate?.(asset, edits.edits);
    }
  }

  async cleanup() {
    for (const tool of this.tools) {
      tool.manager.onDeactivate?.();
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

    const indexedEdits = this.tools.flatMap((tool) => tool.manager.edits).map((edit, index) => ({ ...edit, index }));

    try {
      // Setup the websocket listener before sending the edit request
      const editCompleted = waitForWebsocketEvent(
        'on_asset_edit_thumbnails',
        (assetId) => assetId === this.currentAsset!.id,
        10000,
      );

      await editAsset({
        id: this.currentAsset!.id,
        editActionListDto: {
          edits: indexedEdits as EditActions,
        },
      });

      await editCompleted;
      toastManager.success('Edits applied successfully');
      this.hasAppliedEdits = true;

      return true;
    } catch (error) {
      toastManager.danger('Failed to apply edits');
      return false;
    } finally {
      this.isApplyingEdits = false;
    }
  }
}

export const editManager = new EditManager();
