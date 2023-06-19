import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { QueueName } from '../job.constants';

export class JobIdDto {
  @IsNotEmpty()
  @IsEnum(QueueName)
  @ApiProperty({ type: String, enum: QueueName, enumName: 'JobName' })
  id!: QueueName;
}
