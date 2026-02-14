import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  CreateFavoriteLocationDto,
  FavoriteLocationResponseDto,
  UpdateFavoriteLocationDto,
} from 'src/dtos/favorite-location.dto';
import {
  MapMarkerDto,
  MapMarkerResponseDto,
  MapReverseGeocodeDto,
  MapReverseGeocodeResponseDto,
} from 'src/dtos/map.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MapService } from 'src/services/map.service';

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

  @Authenticated()
  @Get('favorite-locations')
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Get favorite locations',
    description: "Retrieve a list of user's favorite locations.",
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  getFavoriteLocations(@Auth() auth: AuthDto): Promise<FavoriteLocationResponseDto[]> {
    return this.service.getFavoriteLocations(auth);
  }

  @Authenticated()
  @Post('favorite-locations')
  @HttpCode(HttpStatus.CREATED)
  @Endpoint({
    summary: 'Create favorite location',
    description: 'Create a new favorite location for the user.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  createFavoriteLocation(
    @Auth() auth: AuthDto,
    @Body() dto: CreateFavoriteLocationDto,
  ): Promise<FavoriteLocationResponseDto> {
    return this.service.createFavoriteLocation(auth, dto);
  }

  @Authenticated()
  @Put('favorite-locations/:id')
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Update favorite location',
    description: 'Update an existing favorite location.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  updateFavoriteLocation(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Body() dto: UpdateFavoriteLocationDto,
  ): Promise<FavoriteLocationResponseDto> {
    return this.service.updateFavoriteLocation(auth, id, dto);
  }

  @Authenticated()
  @Delete('favorite-locations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete favorite location',
    description: 'Delete a favorite location by its ID.',
    history: new HistoryBuilder().added('v2').stable('v2'),
  })
  deleteFavoriteLocation(@Param('id') id: string) {
    return this.service.deleteFavoriteLocation(id);
  }
}
