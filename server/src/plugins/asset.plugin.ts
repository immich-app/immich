import { ActionType, AssetDto, Plugin, PluginContext } from 'src/interfaces/plugin.interface';

const onAsset = async (ctx: PluginContext, asset: AssetDto) => {
  await ctx.updateAsset({ id: asset.id, isArchived: true });
};

export const plugin: Plugin = {
  version: 1,
  id: 'immich-plugins',
  name: 'Asset Plugin',
  description: 'Immich asset plugin',
  actions: [
    {
      id: 'asset.favorite',
      name: '',
      type: ActionType.ASSET,
      description: '',
      onAction: async (ctx, asset) => {
        await ctx.updateAsset({ id: asset.id, isArchived: false });
      },
    },
    {
      id: 'asset.unfavorite',
      name: '',
      type: ActionType.ASSET,
      description: '',
      onAction: () => {
        console.log('Unfavorite');
      },
    },
    {
      id: 'asset.action',
      name: '',
      type: ActionType.ASSET,
      description: '',
      onAction: (ctx, asset) => onAsset(ctx, asset),
    },
    {
      id: 'album-asset.action',
      name: '',
      type: ActionType.ALBUM_ASSET,
      description: '',
      onAction: (ctx, { asset }) => onAsset(ctx, asset),
    },
    {
      id: 'asset.unarchive',
      name: '',
      type: ActionType.ASSET,
      description: '',
      onAction: () => {
        console.log('Unarchive');
      },
    },
  ],
};
