import { PluginContext, PluginTriggerType } from 'src/enum';
import { JSONSchema } from 'src/types/plugin-schema.types';

export type PluginTrigger = {
  name: string;
  triggerType: PluginTriggerType;
  description: string;
  context: PluginContext;
  schema: JSONSchema | null;
};

export const pluginTriggers: PluginTrigger[] = [
  {
    name: 'Asset Uploaded',
    triggerType: PluginTriggerType.AssetCreate,
    description: 'Triggered when a new asset is uploaded',
    context: PluginContext.Asset,
    schema: null,
  },
  {
    name: 'Person Recognized',
    triggerType: PluginTriggerType.PersonRecognized,
    description: 'Triggered when a person is detected',
    context: PluginContext.Person,
    schema: null,
  },
];
