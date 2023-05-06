import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from 'apps/immich/src/utils/transform.util';
import { ApiProperty } from '@nestjs/swagger';

export class GetMapMarkerDto {
    @IsOptional()
    @IsBoolean()
    @Transform(toBoolean)
    @ApiProperty()
    /**
     * true: returns only a list of locations
     * false: also include asset id
     */
    preload?: boolean;
}