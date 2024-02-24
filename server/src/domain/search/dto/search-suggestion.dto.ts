import { IsArray, IsOptional, IsString } from 'class-validator';

export class SearchSuggestionRequestDto {
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
  @IsArray()
  @IsString({ each: true })
  countries!: string[];

  @IsArray()
  @IsString({ each: true })
  states!: string[];

  @IsArray()
  @IsString({ each: true })
  cities!: string[];

  @IsArray()
  @IsString({ each: true })
  cameraMakes!: string[];

  @IsArray()
  @IsString({ each: true })
  cameraModels!: string[];
}
