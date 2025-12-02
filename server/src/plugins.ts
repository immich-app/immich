import { PluginContext, PluginTriggerType } from 'src/enum';

export type PluginTrigger = {
  name: string;
  type: PluginTriggerType;
  description: string;
  contextType: PluginContext;
};

export const pluginTriggers: PluginTrigger[] = [
  {
    name: 'Asset Uploaded',
    type: PluginTriggerType.AssetCreate,
    description: 'Triggered when a new asset is uploaded',
    contextType: PluginContext.Asset,
  },
  {
    name: 'Person Recognized',
    type: PluginTriggerType.PersonRecognized,
    description: 'Triggered when a person is detected',
    contextType: PluginContext.Person,
  },
];
