import { ArrayNotEmpty } from 'class-validator';
import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  @ArrayNotEmpty()
  sharedUserIds!: string[];
}
