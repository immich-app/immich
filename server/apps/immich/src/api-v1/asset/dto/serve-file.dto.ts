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
  @ApiProperty({ type: Boolean, title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @IsOptional()
  @ApiProperty({ type: Boolean, title: 'Is request made from web' })
  isWeb?: boolean;
}
