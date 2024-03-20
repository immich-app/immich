import { ArrayNotEmpty } from 'class-validator';
import { ValidateUUID } from 'src/validation';

export class AddUsersDto {
  @ValidateUUID({ each: true })
  @ArrayNotEmpty()
  sharedUserIds!: string[];
}
