import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class JobCommandDto {
  @IsNotEmpty()
  @IsIn(['start', 'stop'])
  @ApiProperty({
    enum: ['start', 'stop'],
    enumName: 'JobCommand',
  })
  command!: string;
}
