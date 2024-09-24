import { Controller, Get, HttpCode, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MapMarkerDto,
  MapMarkerResponseDto,
  MapReverseGeocodeDto,
  MapReverseGeocodeResponseDto,
} from 'src/dtos/map.dto';
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

  @Authenticated()
  @Get('reverse-geocode')
  @HttpCode(HttpStatus.OK)
  reverseGeocode(@Query() dto: MapReverseGeocodeDto): Promise<MapReverseGeocodeResponseDto[]> {
    return this.service.reverseGeocode(dto);
  }

  @Authenticated()
  @Get('pmtiles')
  @HttpCode(HttpStatus.OK)
  async getPMTiles(@Res() res: Response) {
    const tileStream = await this.service.getLocalTilesStream();
    return tileStream.pipe(res);
  }
}
