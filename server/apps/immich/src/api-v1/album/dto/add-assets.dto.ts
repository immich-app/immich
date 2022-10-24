import {IsNotEmpty, IsOptional} from 'class-validator';
import {ApiProperty} from "@nestjs/swagger";

export class AddAssetsDto {
  @IsNotEmpty()
  assetIds!: string[];
}

export class AddAssetsQueryDto {
  @IsOptional()
  tryAdd?: boolean;
}