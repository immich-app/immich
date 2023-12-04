import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Optional, toBoolean } from '../../domain.util';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  @Optional()
  q?: string;

  @IsString()
  @IsNotEmpty()
  @Optional()
  query?: string;

  @IsBoolean()
  @Optional()
  @Transform(toBoolean)
  clip?: boolean;
}

export class SearchPeopleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @Transform(toBoolean)
  @Optional()
  withHidden?: boolean;
}
