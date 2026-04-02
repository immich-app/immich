import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';
import { IsGreaterThanOrEqualTo } from 'src/validation';

export class BBoxDto {
  @ApiProperty({ format: 'double', description: 'West longitude (-180 to 180)' })
  @IsLongitude()
  west!: number;

  @ApiProperty({ format: 'double', description: 'South latitude (-90 to 90)' })
  @IsLatitude()
  south!: number;

  @ApiProperty({
    format: 'double',
    description: 'East longitude (-180 to 180). May be less than west when crossing the antimeridian.',
  })
  @IsLongitude()
  east!: number;

  @ApiProperty({ format: 'double', description: 'North latitude (-90 to 90). Must be >= south.' })
  @IsLatitude()
  @IsGreaterThanOrEqualTo('south')
  north!: number;
}
