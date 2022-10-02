import { QueueNameEnum } from '@app/job';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class GetJobDto {
  @IsNotEmpty()
  @IsEnum(QueueNameEnum, {
    message: `params must be one of ${Object.values(QueueNameEnum).join()}`,
  })
  @ApiProperty({
    enum: QueueNameEnum,
    enumName: 'JobId',
  })
  jobId!: string;
}
