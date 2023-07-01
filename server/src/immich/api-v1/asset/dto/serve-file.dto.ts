import { toBoolean } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ServeFileDto {
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  @ApiProperty({ type: Boolean, title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  @ApiProperty({ type: Boolean, title: 'Is request made from web' })
  isWeb?: boolean;
}
