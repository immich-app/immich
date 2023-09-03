import { Optional, toBoolean } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class ServeFileDto {
  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  @ApiProperty({ type: Boolean, title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @Optional()
  @IsBoolean()
  @Transform(toBoolean)
  @ApiProperty({ type: Boolean, title: 'Is request made from web' })
  isWeb?: boolean;
}
