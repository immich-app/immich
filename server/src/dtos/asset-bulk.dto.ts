import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AssetBulkIdDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  @ApiProperty({ 
    type: [String], 
    description: 'Array of asset IDs to process in bulk', 
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'] 
  })
  assetIds!: string[];
}
