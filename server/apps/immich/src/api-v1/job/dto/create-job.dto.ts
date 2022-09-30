import { QueueNameEnum } from '@app/job';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsEnum(QueueNameEnum, {
    message: `Queue name must be one of ${Object.values(QueueNameEnum).join()}`,
  })
  @ApiProperty({
    enum: QueueNameEnum,
    enumName: 'jobType',
  })
  jobType!: string;
}
