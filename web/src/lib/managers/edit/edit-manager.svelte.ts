import CropTool from '$lib/components/asset-viewer/editor/crop-tool/crop-tool.svelte';
import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
import { websocketEvents } from '$lib/stores/websocket';
import { editAsset, type AssetEditsDto, type AssetResponseDto } from '@immich/sdk';
import { ConfirmModal, modalManager, toastManager } from '@immich/ui';
import { mdiCropRotate } from '@mdi/js';
import type { Component } from 'svelte';

export type EditActionTypes = AssetEditsDto['edits'][number];
export type EditActionTypesNoIndex = Omit<AssetEditsDto['edits'][number], 'index'>;
export interface EditToolManager {
  onActivate?: (asset: AssetResponseDto, edits: AssetEditsDto) => void;
  onDeactivate?: () => void;
  hasChanges: boolean;
  edits: EditActionTypesNoIndex[];
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
      newTool.manager.onActivate?.(asset, edits);
    }
  }

  async cleanup() {
    for (const tool of this.tools) {
      tool.manager.onDeactivate?.();
    }
    this.currentAsset = null;
    this.selectedTool = null;
  }

  async applyEdits(): Promise<boolean> {
    console.log('Applying edits...');
    this.isApplyingEdits = true;

    let indexedEdits: AssetEditsDto['edits'] = [];
    let index = 0;
    for (const tool of this.tools) {
      for (const edit of tool.manager.edits) {
        indexedEdits.push({ ...edit, index: index++ } as AssetEditsDto['edits'][number]);
      }
    }

    let cleanupSocket: () => void = () => {};
    const editCompleted = new Promise<void>((resolve) => {
      cleanupSocket = websocketEvents.on('on_asset_edit_thumbnails', (assetId) => {
        if (assetId === this.currentAsset!.id) {
          resolve();
        }
      });
    });

    try {
      await editAsset({
        id: this.currentAsset!.id,
        editActionListDto: {
          edits: indexedEdits,
        },
      });
    } catch (error) {
      this.isApplyingEdits = false;
      toastManager.danger('Failed to apply edits');
      cleanupSocket();

      return false;
    }

    try {
      await Promise.race([editCompleted, new Promise((_, reject) => setTimeout(reject, 10000))]);
    } catch {
      console.warn('Timed out waiting for edit completion websocket event');
    }

    toastManager.success('Edits applied successfully');
    this.isApplyingEdits = false;
    this.hasAppliedEdits = true;
    cleanupSocket();

    return true;
  }
}

export const editManager = new EditManager();
