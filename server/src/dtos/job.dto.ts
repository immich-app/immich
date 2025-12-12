import { ManualJobName } from 'src/enum';
import { ValidateEnum } from 'src/validation';

export class JobCreateDto {
  @ValidateEnum({ enum: ManualJobName, name: 'ManualJobName' })
  name!: ManualJobName;
}
