import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class DownloadFilesDto {
  @IsNotEmpty()
  @ApiProperty({
    isArray: true,
    type: String,
    title: 'Array of asset ids to be downloaded',
  })
  assetIds!: string[];
}
