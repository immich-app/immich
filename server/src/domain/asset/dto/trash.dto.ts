import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTrashDto {
  @IsOptional()
  @IsBoolean()
  restoreAll?: boolean;

  @IsOptional()
  @IsBoolean()
  deleteAll?: boolean;
}
