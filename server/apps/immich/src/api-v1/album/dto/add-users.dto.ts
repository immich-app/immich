import { ValidateUUID } from '../../../../../../apps/immich/src/decorators/validate-uuid.decorator';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  sharedUserIds!: string[];
}
