import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class JobCommandDto {
  @IsNotEmpty()
  @IsIn(['start', 'stop'])
  @ApiProperty({
    enum: ['start', 'stop'],
    enumName: 'JobCommand',
  })
  command!: string;

  @IsOptional()
  @IsBoolean()
  includeAllAssets!: boolean;
}
