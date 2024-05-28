import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { MapMarkerDto, MapMarkerResponseDto } from 'src/dtos/search.dto';
import { MapThemeDto } from 'src/dtos/system-config.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MapService } from 'src/services/map.service';

@ApiTags('Map')
@Controller('map')
export class MapController {
  constructor(private service: MapService) {}

  @Get('markers')
  @Authenticated()
  getMapMarkers(@Auth() auth: AuthDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, options);
  }

  @Authenticated({ sharedLink: true })
  @Get('style.json')
  getMapStyle(@Query() dto: MapThemeDto) {
    return this.service.getMapStyle(dto.theme);
  }
}
