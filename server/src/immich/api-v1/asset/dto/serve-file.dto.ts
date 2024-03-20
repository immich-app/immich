import { ApiProperty } from '@nestjs/swagger';
import { ValidateBoolean } from 'src/domain/domain.util';

export class ServeFileDto {
  @ValidateBoolean({ optional: true })
  @ApiProperty({ title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @ValidateBoolean({ optional: true })
  @ApiProperty({ title: 'Is request made from web' })
  isWeb?: boolean;
}
