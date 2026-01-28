import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Invitation } from 'src/database';
import { toEmail } from 'src/validation';

export class CreateInvitationDto {
  @IsEmail({ require_tld: false })
  @Transform(toEmail)
  @IsNotEmpty()
  @ApiProperty({ example: 'family@example.com' })
  email!: string;
}

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Invitation token from the email link' })
  token!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({ example: 'password' })
  password!: string;
}

export class InvitationResponseDto {
  id!: string;
  email!: string;
  createdAt!: string;
  expiresAt!: string;
  acceptedAt!: string | null;
}

export function mapInvitation(invitation: Invitation): InvitationResponseDto {
  return {
    id: invitation.id,
    email: invitation.email,
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
  };
}
