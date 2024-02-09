import { PeopleResponseDto, PersonResponseDto } from '@app/domain';
import { toBoolean } from '@app/domain/domain.util';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SearchSuggestionType {
  Country = 'country',
  State = 'state',
  City = 'city',
  CameraMake = 'camera-make',
  CameraModel = 'camera-model',
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

export class SearchSuggestionResponseDto {
  data?: string[];
}
