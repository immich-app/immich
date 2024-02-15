import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SearchSuggestionType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  CAMERA_MAKE = 'camera-make',
  CAMERA_MODEL = 'camera-model',
}

export class SearchSuggestionRequestDto {
  @IsEnum(SearchSuggestionType)
  @IsNotEmpty()
  @ApiProperty({ enumName: 'SearchSuggestionType', enum: SearchSuggestionType })
  type!: SearchSuggestionType;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;
}
