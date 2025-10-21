export type PluginFactory = {
  register: () => MaybePromise<Plugin>;
};

export type PluginLike = Plugin | PluginFactory | { default: Plugin } | { plugin: Plugin };

export interface Plugin<T extends PluginConfig | undefined = undefined> {
  version: 1;
  id: string;
  name: string;
  description: string;
  actions: PluginAction<T>[];
}

export type PluginAction<T extends PluginConfig | undefined = undefined> = {
  id: string;
  name: string;
  description: string;
  events?: EventType[];
  config?: T;
} & (
  | { type: ActionType.ASSET; onAction: OnAction<T, AssetDto> }
  | { type: ActionType.ALBUM; onAction: OnAction<T, AlbumDto> }
  | { type: ActionType.ALBUM_ASSET; onAction: OnAction<T, { asset: AssetDto; album: AlbumDto }> }
);

export type OnAction<T extends PluginConfig | undefined, D = PluginActionData> = T extends undefined
  ? (ctx: PluginContext, data: D) => MaybePromise<void>
  : (ctx: PluginContext, data: D, config: InferConfig<T>) => MaybePromise<void>;

export interface PluginContext {
  updateAsset: (asset: { id: string; isArchived: boolean }) => Promise<void>;
}

export type PluginActionData = { data: { asset?: AssetDto; album?: AlbumDto } } & (
  | { type: EventType.ASSET_UPLOAD; data: { asset: AssetDto } }
  | { type: EventType.ASSET_UPDATE; data: { asset: AssetDto } }
  | { type: EventType.ASSET_TRASH; data: { asset: AssetDto } }
  | { type: EventType.ASSET_DELETE; data: { asset: AssetDto } }
  | { type: EventType.ALBUM_CREATE; data: { album: AlbumDto } }
  | { type: EventType.ALBUM_UPDATE; data: { album: AlbumDto } }
);

export type PluginConfig = Record<string, ConfigItem>;

export type ConfigItem = {
  name: string;
  description: string;
  required?: boolean;
} & { [K in Types]: { type: K; default?: InferType<K> } }[Types];

export type InferType<T extends Types> = T extends 'string'
  ? string
  : T extends 'date'
    ? Date
    : T extends 'number'
      ? number
      : T extends 'boolean'
        ? boolean
        : never;

type Types = 'string' | 'boolean' | 'number' | 'date';
type MaybePromise<T = void> = Promise<T> | T;
type IfRequired<T extends ConfigItem, Type> = T['required'] extends true ? Type : Type | undefined;
type InferConfig<T> = T extends PluginConfig
  ? {
      [K in keyof T]: IfRequired<T[K], InferType<T[K]['type']>>;
    }
  : never;

export enum ActionType {
  ASSET = 'asset',
  ALBUM = 'album',
  ALBUM_ASSET = 'album-asset',
}

export enum EventType {
  ASSET_UPLOAD = 'asset.upload',
  ASSET_UPDATE = 'asset.update',
  ASSET_TRASH = 'asset.trash',
  ASSET_DELETE = 'asset.delete',
  ASSET_ARCHIVE = 'asset.archive',
  ASSET_UNARCHIVE = 'asset.unarchive',

  ALBUM_CREATE = 'album.create',
  ALBUM_UPDATE = 'album.update',
  ALBUM_DELETE = 'album.delete',
}

export type AssetDto = { id: string; type: 'asset' };
export type AlbumDto = { id: string; type: 'album' };
