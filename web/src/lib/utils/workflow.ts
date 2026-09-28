import { WorkflowTrigger } from '@immich/sdk';
import type { MessageFormatter } from 'svelte-i18n';
import type { JSONSchemaProperty } from '$lib/types';

export const getTriggerName = ($t: MessageFormatter, type: WorkflowTrigger) => {
  switch (type) {
    case WorkflowTrigger.AssetCreate: {
      return $t('trigger_asset_uploaded');
    }
    // case WorkflowTrigger.PersonRecognized: {
    //   return $t('trigger_person_recognized');
    // }
    case WorkflowTrigger.AssetMetadataExtraction: {
      return $t('trigger_asset_metadata_extraction');
    }
    case WorkflowTrigger.AssetTagged: {
      return $t('trigger_asset_tagged');
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
    // case WorkflowTrigger.PersonRecognized: {
    //   return $t('trigger_person_recognized_description');
    // }
    case WorkflowTrigger.AssetMetadataExtraction: {
      return $t('trigger_asset_metadata_extraction_description');
    }
    case WorkflowTrigger.AssetTagged: {
      return $t('trigger_asset_tagged_description');
    }
    default: {
      return type;
    }
  }
};

export const getWorkflowDefaultConfig = (schema: JSONSchemaProperty) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {};

  const requiredProperties = schema.required ?? [];

  for (const [key, property] of Object.entries(schema.properties ?? {})) {
    // default values
    if (property.default) {
      config[key] = property.default;
      break;
    }

    if (!requiredProperties.includes(key)) {
      continue;
    }

    if (property.array) {
      config[key] = [];
      continue;
    }

    switch (property.type) {
      case 'string': {
        config[key] = '';
        break;
      }

      case 'integer':
      case 'number': {
        config[key] = 0;
        break;
      }

      case 'boolean': {
        config[key] = false;
        break;
      }

      case 'object': {
        config[key] = property.properties ? getWorkflowDefaultConfig(property) : {};
        break;
      }
    }
  }

  return config;
};
