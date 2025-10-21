import sdk from '../../open-api/typescript-sdk';

export type Plugin = {
  id: string;
  name: string;
  description: string;
  filters: Filter[];
  // actions: Action[];
};

export enum EntityType {
  Asset = 'asset',
  Album = 'album',
}

type PluginItem = {
  id: string;
  name: string;
  description?: string;
  type: EntityType;
  configuration?: Config[];
};

type FilterContext<C = Record<string, any>, D = any> = {
  api: {
    getAssetAlbums: (assetId: string) => Promise<any[]>;
  };
  sdk: typeof sdk;
  config: C;
};

type AssetFilter = {
  type: EntityType.Asset;
  filter: (ctx: FilterContext, input: { asset: { id: string } }) => Promise<boolean>;
};

type AlbumFilter = {
  type: EntityType.Album;
  filter: (ctx: FilterContext, input: { album: { id: string; name: string } }) => Promise<boolean>;
};

export type Filter = PluginItem & (AssetFilter | AlbumFilter);

export type Config = {
  key: string;
  type: PluginConfigType;
  required?: boolean;
};

export type PluginConfigType = 'string' | 'number' | 'boolean' | 'date' | 'albumId' | 'assetId';

const authenticate = (ctx: FilterContext) => {
const
  sdk.init()

}

export const corePlugin: Plugin = {
  id: 'immich',
  name: 'Immich Core Plugin',
  description: 'Core actions and filters for workflows',
  filters: [
    {
      id: 'core.notInAnyAlbum',
      name: 'Not in any album',
      description: 'Filters assets that are not in any album',
      type: EntityType.Asset,
      async filter(ctx, { asset }) {
        const albums = await ctx.sdk.getAllAlbums({ assetId: asset.id });
        return albums.length === 0;
      },
    },
    {
      id: 'core.notInAlbum',
      name: 'Not in an album',
      description: 'Run on assets not in the specified album',
      type: EntityType.Asset,
      configuration: [
        {
          key: 'albumId',
          type: 'string',
          required: true,
        },
      ],
      async filter(ctx, { asset }) {
        // missing api to check if an asset is in an album
        const albums = await ctx.sdk.getAllAlbums({ assetId: asset.id });
        return !!albums.find((album) => album.id === ctx.config.albumId);
      },
    },
  ],
};
