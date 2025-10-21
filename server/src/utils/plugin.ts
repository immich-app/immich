import { AssetDto, EventType, OnAction, PluginConfig } from 'src/interfaces/plugin.interface';

export const createPluginAction = <T extends PluginConfig | undefined = undefined>(options: {
  id: string;
  name: string;
  description: string;
  events?: EventType[];
  config?: T;
}) => ({
  addHandler: (onAction: OnAction<T>) => ({ ...options, onAction }),
  onAsset: (onAction: OnAction<T, AssetDto>) => ({ ...options, onAction }),
});
