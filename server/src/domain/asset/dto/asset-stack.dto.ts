import { ValidateUUID } from '../../domain.util';

export class UpdateStackParentDto {
  @ValidateUUID()
  oldParentId!: string;

  @ValidateUUID()
  newParentId!: string;
}
