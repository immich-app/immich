import { ArrayNotEmpty } from 'class-validator';
import { ValidateUUID } from '../../domain.util';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  @ArrayNotEmpty()
  sharedUserIds!: string[];
}
