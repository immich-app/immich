import { ApiProperty } from '@nestjs/swagger';

export class AssetOcrResponseDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  id!: string;

  @ApiProperty({ type: 'string', format: 'uuid' })
  assetId!: string;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized x coordinate of box corner 1 (0-1)' })
  x1!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized y coordinate of box corner 1 (0-1)' })
  y1!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized x coordinate of box corner 2 (0-1)' })
  x2!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized y coordinate of box corner 2 (0-1)' })
  y2!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized x coordinate of box corner 3 (0-1)' })
  x3!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized y coordinate of box corner 3 (0-1)' })
  y3!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized x coordinate of box corner 4 (0-1)' })
  x4!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Normalized y coordinate of box corner 4 (0-1)' })
  y4!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Confidence score for text detection box' })
  boxScore!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Confidence score for text recognition' })
  textScore!: number;

  @ApiProperty({ type: 'string', description: 'Recognized text' })
  text!: string;
}
