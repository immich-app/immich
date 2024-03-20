import { ValidateBoolean } from 'src/domain/domain.util';

export class DeleteUserDto {
  @ValidateBoolean({ optional: true })
  force?: boolean;
}
