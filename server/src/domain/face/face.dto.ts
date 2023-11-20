import { ValidateUUID } from '../domain.util';

export class FacesDto {
  @ValidateUUID({ each: true })
  ids!: string[];
}

export class FaceDto {
  @ValidateUUID()
  id!: string;
}
