import { WorkflowTrigger } from '@immich/sdk';
import type { MessageFormatter } from 'svelte-i18n';

export const getTriggerName = ($t: MessageFormatter, type: WorkflowTrigger) => {
  switch (type) {
    case WorkflowTrigger.AssetCreate: {
      return $t('trigger_asset_uploaded');
    }
    case WorkflowTrigger.PersonRecognized: {
      return $t('trigger_person_recognized');
    }
    case WorkflowTrigger.AlbumAssetAdded: {
      return $t('trigger_album_asset_added');
    }
    default: {
      return type;
    }
  }
};

export const getTriggerDescription = ($t: MessageFormatter, type: WorkflowTrigger) => {
  switch (type) {
    case WorkflowTrigger.AssetCreate: {
      return $t('trigger_asset_uploaded_description');
    }
    case WorkflowTrigger.PersonRecognized: {
      return $t('trigger_person_recognized_description');
    }
    case WorkflowTrigger.AlbumAssetAdded: {
      return $t('trigger_album_asset_added_description');
    }
    default: {
      return type;
    }
  }
};
