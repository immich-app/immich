import { PeopleResponseDto, PersonResponseDto } from '@app/domain';
import { toBoolean } from '@app/domain/domain.util';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class SearchSuggestionRequestDto {
  // People
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isPeople?: boolean;

  // Location
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isCountry?: boolean;

  @IsString()
  @IsOptional()
  country?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isState?: boolean;

  @IsString()
  @IsOptional()
  state?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isCity?: boolean;

  // Camera
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isCameraMake?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isCameraModel?: boolean;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class SearchSuggestionResponseDto {
  people?: PersonResponseDto[];
  data?: string[];
}
