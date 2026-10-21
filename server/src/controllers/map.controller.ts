import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { FavoriteLocationCreateDto, FavoriteLocationResponseDto } from 'src/dtos/favorite-location.dto.js';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import {
  MapMarkerDto,
  MapMarkerResponseDto,
  MapReverseGeocodeDto,
  MapReverseGeocodeResponseDto,
} from 'src/dtos/map.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { MapService } from 'src/services/map.service.js';
import { UUIDParamDto } from 'src/validation.js';

@ApiTags(ApiTag.Map)
@Controller('map')
export class MapController {
  constructor(private service: MapService) {}

  @Get('markers')
  @Authenticated({ permission: Permission.MapRead })
  @Endpoint({
    summary: 'Retrieve map markers',
    description: 'Retrieve a list of latitude and longitude coordinates for every asset with location data.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getMapMarkers(@Auth() auth: AuthDto, @Query() options: MapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getMapMarkers(auth, options);
  }

  @Get('reverse-geocode')
  @Authenticated({ permission: Permission.MapSearch })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Reverse geocode coordinates',
    description: 'Retrieve location information (e.g., city, country) for given latitude and longitude coordinates.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  reverseGeocode(@Query() dto: MapReverseGeocodeDto): Promise<MapReverseGeocodeResponseDto[]> {
    return this.service.reverseGeocode(dto);
  }

  @Get('favorite-locations')
  @Authenticated()
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Get favorite locations',
    description: 'Retrieve the authenticated user’s saved locations.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getFavoriteLocations(@Auth() auth: AuthDto): Promise<FavoriteLocationResponseDto[]> {
    return this.service.getFavoriteLocations(auth);
  }

  @Post('favorite-locations')
  @Authenticated()
  @HttpCode(HttpStatus.CREATED)
  @Endpoint({
    summary: 'Create favorite location',
    description: 'Save a named location for the authenticated user.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  createFavoriteLocation(
    @Auth() auth: AuthDto,
    @Body() dto: FavoriteLocationCreateDto,
  ): Promise<FavoriteLocationResponseDto> {
    return this.service.createFavoriteLocation(auth, dto);
  }

  @Delete('favorite-locations/:id')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete favorite location',
    description: 'Delete one of the authenticated user’s saved locations.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  deleteFavoriteLocation(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteFavoriteLocation(auth, id);
  }
}
