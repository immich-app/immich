import { IsOptional, IsEnum } from 'class-validator';

export enum Ownership {
  Mine = 'mine',
  Theirs = 'theirs',
}

export class GetAlbumsDto {
  @IsOptional()
  @IsEnum(Ownership)
  owner?: Ownership;
}
