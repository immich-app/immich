import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';

export class WebhookDefinitionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  id?: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  retries?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  backoffMs?: number;

  @IsOptional()
  @IsBoolean()
  includeServerEvents?: boolean;
}

export class WebhookConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookDefinitionDto)
  webhooks: WebhookDefinitionDto[] = [];
}
