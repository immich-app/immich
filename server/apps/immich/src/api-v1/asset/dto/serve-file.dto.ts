import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsBooleanString, IsNotEmpty, IsOptional } from 'class-validator';

export class ServeFileDto {
  @IsNotEmpty()
  @ApiProperty({ type: String, title: 'Device Asset ID' })
  aid!: string;

  @IsNotEmpty()
  @ApiProperty({ type: String, title: 'Device ID' })
  did!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value == 'true') {
      return true;
    } else if (value == 'false') {
      return false;
    }
    return value;
  })
  @ApiProperty({ type: Boolean, title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value == 'true') {
      return true;
    } else if (value == 'false') {
      return false;
    }
    return value;
  })
  @ApiProperty({ type: Boolean, title: 'Is request made from web' })
  isWeb?: boolean;
}
