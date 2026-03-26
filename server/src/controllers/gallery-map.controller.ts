import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { FilteredMapMarkerDto } from 'src/dtos/gallery-map.dto';
import { MapMarkerResponseDto } from 'src/dtos/map.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SharedSpaceService } from 'src/services/shared-space.service';

@ApiTags('Gallery Map')
@Controller('gallery/map')
export class GalleryMapController {
  constructor(private service: SharedSpaceService) {}

  @Get('markers')
  @Authenticated()
  @Endpoint({
    summary: 'Get filtered map markers',
    description: 'Retrieve map markers with rich content filtering (people, camera, tags, etc.)',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getFilteredMapMarkers(@Auth() auth: AuthDto, @Query() dto: FilteredMapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getFilteredMapMarkers(auth, dto);
  }
}
