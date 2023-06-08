import { ArrayNotEmpty } from 'class-validator';
import { ValidateUUID } from '../../../../../apps/immich/src/decorators/validate-uuid.decorator';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  @ArrayNotEmpty()
  sharedUserIds!: string[];
}
