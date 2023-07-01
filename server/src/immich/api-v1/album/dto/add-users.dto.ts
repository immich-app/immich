import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator.js';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  sharedUserIds!: string[];
}
