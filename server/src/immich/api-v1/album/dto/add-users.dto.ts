import { ValidateUUID } from '@app/immich/decorators/validate-uuid.decorator';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  sharedUserIds!: string[];
}
