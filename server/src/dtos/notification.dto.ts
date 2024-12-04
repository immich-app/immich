import { IsString } from 'class-validator';

export class TestEmailResponseDto {
  messageId!: string;
}
export class TemplateResponseDto {
  name!: string;
  html!: string;
}
export class TemplateDto {
  @IsString()
  template!: string;
}
