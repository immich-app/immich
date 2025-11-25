import { PluginContext, PluginTriggerType } from 'src/enum';

export type PluginTrigger = {
  name: string;
  triggerType: PluginTriggerType;
  description: string;
  context: PluginContext;
};

export const pluginTriggers: PluginTrigger[] = [
  {
    name: 'Asset Uploaded',
    triggerType: PluginTriggerType.AssetCreate,
    description: 'Triggered when a new asset is uploaded',
    context: PluginContext.Asset,
  },
  {
    name: 'Person Recognized',
    triggerType: PluginTriggerType.PersonRecognized,
    description: 'Triggered when a person is detected',
    context: PluginContext.Person,
  },
];
