import { ValidateBoolean } from 'src/validation';

export class DeleteUserDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}
