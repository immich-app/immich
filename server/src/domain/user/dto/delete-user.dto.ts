import { ValidateBoolean } from '../../domain.util';

export class DeleteUserDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}
