import { ClassConstructor } from 'class-transformer';
import { SystemConfig } from 'src/config';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { JobItem, QueueName } from 'src/interfaces/job.interface';

export const IEventRepository = 'IEventRepository';

type EventMap = {
  // app events
  'app.bootstrap': [];
  'app.shutdown': [];

  'config.init': [{ newConfig: SystemConfig }];
  // config events
  'config.update': [
    {
      newConfig: SystemConfig;
      oldConfig: SystemConfig;
    },
  ];
  'config.validate': [{ newConfig: SystemConfig; oldConfig: SystemConfig }];

  // album events
  'album.update': [{ id: string; recipientIds: string[] }];
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

  'job.start': [QueueName, JobItem];

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

export enum BootstrapEventPriority {
  // Database service should be initialized before anything else, most other services need database access
  DatabaseService = -200,
  // Initialise config after other bootstrap services, stop other services from using config on bootstrap
  SystemConfig = 100,
}

export interface IEventRepository {
  setup(options: { services: ClassConstructor<unknown>[] }): void;
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
