import { ApiProperty } from '@nestjs/swagger';
import { ManualJobName } from 'src/enum';
import { ValidateEnum } from 'src/validation';

export class JobCreateDto {
  @ApiProperty({ description: 'Job name', enum: ManualJobName })
  @ValidateEnum({ enum: ManualJobName, name: 'ManualJobName' })
  name!: ManualJobName;
}
