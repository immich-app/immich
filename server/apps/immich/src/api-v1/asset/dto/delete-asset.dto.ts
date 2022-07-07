import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class DeleteAssetDto {
  @IsNotEmpty()
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array of asset IDs to delete',
    example: [
      'bf973405-3f2a-48d2-a687-2ed4167164be',
      'dd41870b-5d00-46d2-924e-1d8489a0aa0f',
      'fad77c3f-deef-4e7e-9608-14c1aa4e559a',
    ],
  })
  ids!: string[];
}
