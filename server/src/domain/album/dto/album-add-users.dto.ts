import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator.js';
import { ArrayNotEmpty } from 'class-validator';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  @ArrayNotEmpty()
  sharedUserIds!: string[];
}
