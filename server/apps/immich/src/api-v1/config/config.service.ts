import { Injectable } from '@nestjs/common';
import { AdminConfigResponseDto } from './response-dto/admin-config-response.dto';
import { AdminConfigService } from "@app/admin-config";

@Injectable()
export class ConfigService {
  constructor(
    private adminConfigService: AdminConfigService
  ){}

  async getAllConfig(): Promise<AdminConfigResponseDto> {
    const config = await this.adminConfigService.getConfig();
    return { config }
  }
}
