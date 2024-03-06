import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteUserOptionsDto {
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
