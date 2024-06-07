import { IsNotEmpty, IsOptional } from 'class-validator';

export class SmtpVerificationDto {
  @IsNotEmpty()
  host!: string;

  @IsOptional()
  port?: number;

  @IsOptional()
  username?: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  ignoreCert?: boolean;

  @IsNotEmpty()
  from!: string;
}
