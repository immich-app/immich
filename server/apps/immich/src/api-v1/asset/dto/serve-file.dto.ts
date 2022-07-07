import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString, IsNotEmpty, IsOptional } from 'class-validator';

export class ServeFileDto {
  @IsNotEmpty()
  @ApiProperty({ type: String, title: 'Device Asset ID' })
  aid!: string;

  @IsNotEmpty()
  @ApiProperty({ type: String, title: 'Device ID' })
  did!: string;

  @IsOptional()
  @IsBooleanString()
  isThumb?: string;

  @IsOptional()
  @IsBooleanString()
  isWeb?: string;
}
