import { ValidateBoolean } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';

export class ServeFileDto {
  @ValidateBoolean({ optional: true })
  @ApiProperty({ title: 'Is serve thumbnail (resize) file' })
  isThumb?: boolean;

  @ValidateBoolean({ optional: true })
  @ApiProperty({ title: 'Is request made from web' })
  isWeb?: boolean;
}
