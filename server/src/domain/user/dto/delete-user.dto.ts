import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteUserDto {
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
