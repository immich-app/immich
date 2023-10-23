import { IsString } from 'class-validator';

export class SystemConfigStylesheetsDto {
  @IsString()
  css!: string;
}
