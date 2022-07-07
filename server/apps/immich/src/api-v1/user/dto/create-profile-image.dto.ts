import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
