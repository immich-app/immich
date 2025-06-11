import { Injectable } from '@nestjs/common';
import { ServerPingResponse } from 'src/dtos/server.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class MaintenanceService extends BaseService {
  ping(): ServerPingResponse {
    // this.eventRepository.clientBroadcast();
    return { res: 'Pong!' };
  }
}
