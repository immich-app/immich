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
    default: {
      return type;
    }
  }
};
