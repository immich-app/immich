import { ClassConstructor } from 'class-transformer';
import { SystemConfig } from 'src/config';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { ImmichWorker } from 'src/enum';

export const IEventRepository = 'IEventRepository';

type EventMap = {
  // app events
  'app.bootstrap': [ImmichWorker];
  'app.shutdown': [ImmichWorker];

  // config events
  'config.update': [
    {
      newConfig: SystemConfig;
      /** When the server starts, `oldConfig` is `undefined` */
      oldConfig?: SystemConfig;
    },
  ];
  'config.validate': [{ newConfig: SystemConfig; oldConfig: SystemConfig }];

  // album events
  'album.update': [{ id: string; updatedBy: string }];
  'album.invite': [{ id: string; userId: string }];

  // asset events
  'asset.tag': [{ assetId: string }];
  'asset.untag': [{ assetId: string }];
  'asset.hide': [{ assetId: string; userId: string }];
  'asset.show': [{ assetId: string; userId: string }];
  'asset.trash': [{ assetId: string; userId: string }];
  'asset.delete': [{ assetId: string; userId: string }];

  // asset bulk events
  'assets.trash': [{ assetIds: string[]; userId: string }];
  'assets.delete': [{ assetIds: string[]; userId: string }];
  'assets.restore': [{ assetIds: string[]; userId: string }];

  // session events
  'session.delete': [{ sessionId: string }];

  // stack events
  'stack.create': [{ stackId: string; userId: string }];
  'stack.update': [{ stackId: string; userId: string }];
  'stack.delete': [{ stackId: string; userId: string }];

  // stack bulk events
  'stacks.delete': [{ stackIds: string[]; userId: string }];

  // user events
  'user.signup': [{ notify: boolean; id: string; tempPassword?: string }];

  // websocket events
  'websocket.connect': [{ userId: string }];
};

export const serverEvents = ['config.update'] as const;
export type ServerEvents = (typeof serverEvents)[number];

export type EmitEvent = keyof EventMap;
export type EmitHandler<T extends EmitEvent> = (...args: ArgsOf<T>) => Promise<void> | void;
export type ArgOf<T extends EmitEvent> = EventMap[T][0];
export type ArgsOf<T extends EmitEvent> = EventMap[T];

export interface ClientEventMap {
  on_upload_success: [AssetResponseDto];
  on_user_delete: [string];
  on_asset_delete: [string];
  on_asset_trash: [string[]];
  on_asset_update: [AssetResponseDto];
  on_asset_hidden: [string];
  on_asset_restore: [string[]];
  on_asset_stack_update: string[];
  on_person_thumbnail: [string];
  on_server_version: [ServerVersionResponseDto];
  on_config_update: [];
  on_new_release: [ReleaseNotification];
  on_session_delete: [string];
}

export type EventItem<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  server: boolean;
};

export interface IEventRepository {
  setup(options: { services: ClassConstructor<unknown>[] }): void;
  on<T extends keyof EventMap>(item: EventItem<T>): void;
  emit<T extends keyof EventMap>(event: T, ...args: ArgsOf<T>): Promise<void>;

  /**
   * Send to connected clients for a specific user
   */
  clientSend<E extends keyof ClientEventMap>(event: E, room: string, ...data: ClientEventMap[E]): void;
  /**
   * Send to all connected clients
   */
  clientBroadcast<E extends keyof ClientEventMap>(event: E, ...data: ClientEventMap[E]): void;
  /**
   * Send to all connected servers
   */
  serverSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void;
}
