import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UUIDParamDto {
  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  id!: string;
}
