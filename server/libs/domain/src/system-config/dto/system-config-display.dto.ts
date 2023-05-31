import { IsHexColor, ValidateIf } from 'class-validator';

export class SystemConfigDisplayDto {
  @ValidateIf((_, value) => value !== '')
  @IsHexColor()
  accentColor!: string;

  @ValidateIf((_, value) => value !== '')
  @IsHexColor()
  darkAccentColor!: string;
}
