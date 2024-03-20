import { ValidateUUID } from 'src/validation';

export class UpdateStackParentDto {
  @ValidateUUID()
  oldParentId!: string;

  @ValidateUUID()
  newParentId!: string;
}
