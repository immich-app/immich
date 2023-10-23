import { IsString } from 'class-validator';

export class SystemConfigThemeDto {
  @IsString()
  customCss!: string;
}
