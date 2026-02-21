import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { UserResponseSchema } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { ValidateEnum, ValidateUUID } from 'src/validation';
import z from 'zod';

export class PartnerCreateDto {
  @ValidateUUID({ description: 'User ID to share with' })
  sharedWithId!: string;
}

export class PartnerUpdateDto {
  @ApiProperty({ description: 'Show partner assets in timeline' })
  @IsNotEmpty()
  inTimeline!: boolean;
}

export class PartnerSearchDto {
  @ValidateEnum({ enum: PartnerDirection, name: 'PartnerDirection', description: 'Partner direction' })
  direction!: PartnerDirection;
}

export const PartnerResponseSchema = UserResponseSchema.extend({
  inTimeline: z.boolean().optional().describe('Show in timeline'),
})
  .describe('Partner response')
  .meta({ id: 'PartnerResponseDto' });

export class PartnerResponseDto extends createZodDto(PartnerResponseSchema) {}
