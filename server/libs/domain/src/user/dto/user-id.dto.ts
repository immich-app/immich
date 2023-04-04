import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UserIdDto {
  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId!: string;
}
