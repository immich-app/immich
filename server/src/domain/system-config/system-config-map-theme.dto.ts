import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum MapTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export class MapThemeDto {
  @IsEnum(MapTheme)
  @ApiProperty({ enum: MapTheme, enumName: 'MapTheme' })
  theme!: MapTheme;
}
