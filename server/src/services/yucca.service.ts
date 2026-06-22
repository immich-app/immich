import { EventsGateway, ModuleConfigRepository } from '@futo-org/backups-orchestrator-api/dist';
import { GatewayEvent } from '@futo-org/backups-orchestrator-api/dist/events/events.gateway';
import { Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import { DatabaseLock, ImmichWorker, StorageFolder } from 'src/enum';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { AuthService } from 'src/services/auth.service';
import { getExternalDomain } from 'src/utils/misc';

@Injectable()
export class YuccaService implements OnModuleInit, OnModuleDestroy {
  private lock = false;

  constructor(
    private readonly databaseRepository: DatabaseRepository,
    private readonly libraryRepository: LibraryRepository,
    private readonly authService: AuthService,
    private readonly websocketRepository: WebsocketRepository,
    @Optional() private readonly moduleConfig: ModuleConfigRepository,
    @Optional() private readonly eventsGateway: EventsGateway,
  ) {
    this.onInternalEvent = this.onInternalEvent.bind(this);
  }

  onModuleInit() {
    if (this.eventsGateway) {
      this.eventsGateway.setAuthFn(async (client) =>
        this.authService.authenticate({
          headers: client.request.headers,
          queryParams: {},
          metadata: { adminRoute: true, sharedLinkRoute: false, uri: '/api/yucca/socket.io' },
        }),
      );

      this.eventsGateway.on(this.onInternalEvent);
    }
  }

  onModuleDestroy() {
    if (this.eventsGateway) {
      this.eventsGateway.off(this.onInternalEvent);
    }
  }

  private updateSystemConfig({ server }: SystemConfig) {
    this.moduleConfig.update({
      externalBaseUrl: getExternalDomain(server),
    });
  }

  private async updateLibraryConfig() {
    const libraries = await this.libraryRepository.getAll();

    this.moduleConfig.update({
      immichIntegration: {
        dataPath: StorageCore.getMediaLocation(),
        dataFolders: Object.values(StorageFolder),
        libraries: libraries
          .filter((library) => !library.deletedAt)
          .map(({ id, name, importPaths, exclusionPatterns }) => ({ id, name, importPaths, exclusionPatterns })),
      },
    });
  }

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Api] })
  async onConfigInit({ newConfig }: ArgOf<'ConfigInit'>) {
    this.updateSystemConfig(newConfig);
    void this.updateLibraryConfig();

    this.lock = await this.databaseRepository.tryLock(DatabaseLock.YuccaModuleConfig);

    if (this.lock) {
      this.moduleConfig.acquireLock();
    }
  }

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Api], server: true })
  onConfigUpdate({ newConfig }: ArgOf<'ConfigUpdate'>) {
    void this.updateSystemConfig(newConfig);
  }

  @OnEvent({ name: 'LibraryCreate', workers: [ImmichWorker.Api], server: true })
  onLibraryCreate() {
    void this.updateLibraryConfig();
  }

  @OnEvent({ name: 'LibraryUpdate', workers: [ImmichWorker.Api], server: true })
  onLibraryUpdate() {
    void this.updateLibraryConfig();
  }

  @OnEvent({ name: 'LibraryDelete', workers: [ImmichWorker.Api], server: true })
  onLibraryDelete() {
    void this.updateLibraryConfig();
  }

  @OnEvent({ name: 'YuccaEvent', workers: [ImmichWorker.Api], server: true })
  onYuccaEvent(event: GatewayEvent) {
    this.eventsGateway.emit(event);
  }

  onInternalEvent(event: GatewayEvent) {
    this.websocketRepository.serverSend('YuccaEvent', event);
  }
}
