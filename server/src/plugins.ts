import { PluginContext, PluginTriggerType } from 'src/enum';
import { JSONSchema } from 'src/types/plugin-schema.types';

export type PluginTrigger = {
  name: string;
  type: PluginTriggerType;
  description: string;
  context: PluginContext;
  schema: JSONSchema | null;
};

export const pluginTriggers: PluginTrigger[] = [
  {
    name: 'Asset Uploaded',
    type: PluginTriggerType.AssetCreate,
    description: 'Triggered when a new asset is uploaded',
    context: PluginContext.Asset,
    schema: {
      type: 'object',
      properties: {
        assetType: {
          type: 'string',
          description: 'Type of the asset',
          default: 'ALL',
          enum: ['Image', 'Video', 'All'],
        },
      },
    },
  },
  {
    name: 'Person Recognized',
    type: PluginTriggerType.PersonRecognized,
    description: 'Triggered when a person is detected in an asset',
    context: PluginContext.Person,
    schema: null,
  },
];
