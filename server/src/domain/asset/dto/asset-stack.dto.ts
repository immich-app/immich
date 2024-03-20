import { ValidateUUID } from 'src/domain/domain.util';

export class UpdateStackParentDto {
  @ValidateUUID()
  oldParentId!: string;

  @ValidateUUID()
  newParentId!: string;
}
