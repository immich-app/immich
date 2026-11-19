import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { WebsocketRepository } from 'src/repositories/websocket.repository.js';

type ResourcePaths = (string | false | undefined)[];

export type ResourceEvent = { userIds: string[]; changed?: ResourcePaths; deleted?: ResourcePaths };

@Injectable()
export class ResourceRepository {
  constructor(
    private cls: ClsService,
    private websocketRepository: WebsocketRepository,
  ) {}

  send({ userIds, changed = [], deleted = [] }: ResourceEvent) {
    const event = { changed: toUniquePaths(changed), deleted: toUniquePaths(deleted) };
    if (userIds.length === 0 || (event.changed.length === 0 && event.deleted.length === 0)) {
      return;
    }

    this.websocketRepository.clientSend('ResourceEventV1', [...new Set(userIds)], {
      ...event,
      correlationId: this.cls.getId(),
    });
  }
}

const toUniquePaths = (paths: ResourcePaths) => [...new Set(paths.filter((path) => typeof path === 'string'))];
