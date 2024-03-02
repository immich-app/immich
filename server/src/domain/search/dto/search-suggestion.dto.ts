import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Optional } from '../../domain.util';

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
  @Optional()
  country?: string;

  @IsString()
  @Optional()
  state?: string;

  @IsString()
  @Optional()
  make?: string;

  @IsString()
  @Optional()
  model?: string;
}
