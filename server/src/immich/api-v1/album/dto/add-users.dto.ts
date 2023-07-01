import { ValidateUUID } from '@app/domain';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  sharedUserIds!: string[];
}
