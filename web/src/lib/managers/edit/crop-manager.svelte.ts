import type { EditActionTypes, EditToolManager } from '$lib/managers/edit/edit-manager.svelte';

class CropManager implements EditToolManager {
  hasChanges: boolean = $state(false);

  getEdits(): EditActionTypes[] {
    // TODO return crop edits
    return [];
  }

  onActivate() {
    // TODO
  }

  onDeactivate() {
    // TODO
  }
}

export const cropManager = new CropManager();
