import { PluginContext, PluginTriggerType } from 'src/enum';

export type PluginTrigger = {
  type: PluginTriggerType;
  contextType: PluginContext;
};

export const pluginTriggers: PluginTrigger[] = [
  {
    type: PluginTriggerType.AssetCreate,
    contextType: PluginContext.Asset,
  },
  {
    type: PluginTriggerType.PersonRecognized,
    contextType: PluginContext.Person,
  },
];
