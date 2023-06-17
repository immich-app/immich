import { AssetService, AuthUserDto, MapMarkerResponseDto, MemoryLaneDto } from '@app/domain';
import { MapMarkerDto } from '@app/domain/asset/dto/map-marker.dto';
import { MemoryLaneResponseDto } from '@app/domain/asset/response-dto/memory-lane-response.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Authenticated } from '../decorators/authenticated.decorator';
import { UseValidation } from '../decorators/use-validation.decorator';

@ApiTags('Asset')
@Controller('asset')
@Authenticated()
@UseValidation()
export class AssetController {
  constructor(private service: AssetService) {}

  @Get('map-marker')
  getMapMarkers(@AuthUser() authUser: AuthUserDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(authUser, options);
  }

  @Get('memory-lane')
  getMemoryLane(@AuthUser() authUser: AuthUserDto, @Query() dto: MemoryLaneDto): Promise<MemoryLaneResponseDto[]> {
    return this.service.getMemoryLane(authUser, dto);
  }
}
