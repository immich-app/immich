import { ValidateUUID } from '../domain.util';

export class FaceDto {
  @ValidateUUID()
  id!: string;
}
