import { ArrayNotEmpty } from 'class-validator';
import { ValidateUUID } from 'src/domain/domain.util';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  @ArrayNotEmpty()
  sharedUserIds!: string[];
}
