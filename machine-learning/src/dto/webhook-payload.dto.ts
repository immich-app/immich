import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export enum WebhookEventTypes {
  AssetCreationEvent = 'AssetCreationEvent',
}

export class AssetDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  resizePath!: string;
}

export class WebhookPayloadDto {
  @IsEnum(WebhookEventTypes)
  type: WebhookEventTypes;

  @ValidateNested()
  @Type(() => AssetDto)
  asset: AssetDto;
}
