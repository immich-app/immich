import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { JobCommand } from '../job.constants';

export class JobCommandDto {
  @IsNotEmpty()
  @IsEnum(JobCommand)
  @ApiProperty({ type: 'string', enum: JobCommand, enumName: 'JobCommand' })
  command!: JobCommand;

  @IsOptional()
  @IsBoolean()
  force!: boolean;
}
