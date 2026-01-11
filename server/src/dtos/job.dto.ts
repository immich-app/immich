import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ManualJobName } from 'src/enum';
import { ValidateEnum } from 'src/validation';

@ApiSchema({ description: 'Job creation request with job name' })
export class JobCreateDto {
  @ApiProperty({ description: 'Job name', enum: ManualJobName })
  @ValidateEnum({ enum: ManualJobName, name: 'ManualJobName' })
  name!: ManualJobName;
}
