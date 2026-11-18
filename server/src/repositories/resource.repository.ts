import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { WebsocketRepository } from 'src/repositories/websocket.repository.js';

export type ResourceUpdate = { userIds: string[]; paths: (string | false | undefined)[] };

@Injectable()
export class ResourceRepository {
  constructor(
    private cls: ClsService,
    private websocketRepository: WebsocketRepository,
  ) {}

  send(update: ResourceUpdate) {
    this.emit('ResourceUpdateV1', update);
  }

  delete(update: ResourceUpdate) {
    this.emit('ResourceDeleteV1', update);
  }

  private emit(event: 'ResourceUpdateV1' | 'ResourceDeleteV1', { userIds, paths }: ResourceUpdate) {
    const resourcePaths = [...new Set(paths.filter((path) => typeof path === 'string'))];
    if (userIds.length === 0 || resourcePaths.length === 0) {
      return;
    }

    this.websocketRepository.clientSend(event, [...new Set(userIds)], {
      paths: resourcePaths,
      correlationId: this.cls.getId(),
    });
  }
}
