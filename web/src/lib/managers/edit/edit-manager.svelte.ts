import CropTool from '$lib/components/asset-viewer/editor/crop-tool/crop-tool.svelte';
import { cropManager } from '$lib/managers/edit/crop-manager.svelte';
import type { AssetEditsDto } from '@immich/sdk';
import { ConfirmModal, modalManager } from '@immich/ui';
import { mdiCropRotate } from '@mdi/js';
import type { Component } from 'svelte';

export type EditActionTypes = AssetEditsDto['edits'][number];
export interface EditToolManager {
  onActivate?: () => void;
  onDeactivate?: () => void;
  getEdits: () => EditActionTypes[];
  hasChanges: boolean;
}

export enum EditToolType {
  CROP = 'crop',
  ROTATE = 'rotate',
  MIRROR = 'mirror',
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
      type: EditToolType.CROP,
      icon: mdiCropRotate,
      component: CropTool,
      manager: cropManager,
    },
  ];
  selectedTool = $state<EditTool>(this.tools[0]);
  hasChanges = $derived(this.tools.some((t) => t.manager.hasChanges));

  // used to disable multiple confirm dialogs and mouse events while one is open
  isShowingConfirmDialog = $state(false);

  async closeConfirm(): Promise<boolean> {
    // Prevent multiple dialogs (usually happens with rapid escape key presses)
    if (this.isShowingConfirmDialog) return false;
    if (!this.hasChanges) return true;

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

  async selectTool(toolType: EditToolType) {
    if (this.selectedTool.type === toolType) {
      return;
    }
    this.selectedTool.manager.onDeactivate?.();
    const newTool = this.tools.find((t) => t.type === toolType);
    if (newTool) {
      this.selectedTool = newTool;
      newTool.manager.onActivate?.();
    }
  }
}

export const editManager = new EditManager();
