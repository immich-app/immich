import { Controller, Get, NotFoundException, Param, HttpCode, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
// @ts-expect-error test
import { PMTiles, RangeResponse, Source } from 'pmtiles';
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

  source = new FileSource('./resources/v1.pmtiles');
  pmtiles = new PMTiles(this.source);

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

  @Get('tiles.json')
  async getTilesJson() {
    // eslint-disable-next-line unicorn/no-await-expression-member
    return JSON.parse((await fs.readFile(`./resources/tiles.json`)).toString());
  }

  @Get('tiles/:z/:x/:y.:format')
  async getTiles(
    @Param('z') z: number,
    @Param('x') x: number,
    @Param('y') y: number,
    @Param('format') format: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // load data based on tile request
    console.log('getting tile');
    const tile = await this.pmtiles.getZxy(Number(z), Number(x), Number(y));
    console.log('tile', tile);
    if (!tile) {
      throw new NotFoundException('Tile not found.');
    }
    console.log('getting');
    const data = Buffer.from(tile.data);
    console.log('got buffer');

    // determine content-type header based on data
    // (assume pbf for now)
    console.log('getting header');
    const header = await this.pmtiles.getHeader();
    console.log('header', header);
    switch (header.tileType) {
      case 0: {
        console.log('Unknown tile type.');
        break;
      }
      case 1: {
        res.setHeader('Content-Type', 'application/x-protobuf');
        break;
      }
    }

    res.status(200).send(data);
  }
}

class FileSource implements Source {
  filename: string;
  fileDescriptor: number;

  constructor(filename: string) {
    this.filename = filename;
    this.fileDescriptor = fsSync.openSync(filename, 'r');
  }

  getKey() {
    return this.filename;
  }

  // helper async function to read in bytes from file
  readBytesIntoBuffer = async (buffer: Buffer, offset: number) =>
    new Promise<void>((resolve, reject) => {
      fsSync.read(this.fileDescriptor, buffer, 0, buffer.length, offset, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

  getBytes = async (offset: number, length: number) => {
    // create buffer and read in byes from file
    const buffer = Buffer.alloc(length);
    await this.readBytesIntoBuffer(buffer, offset);

    const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    return { data } as RangeResponse;
  };
}
