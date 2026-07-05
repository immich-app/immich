import { createZodDto } from 'nestjs-zod';
import { UserResponseSchema } from 'src/dtos/user.dto';
import { PartnerDirection } from 'src/repositories/partner.repository';
import z from 'zod';

const PartnerDirectionSchema = z.enum(PartnerDirection).describe('Partner direction').meta({ id: 'PartnerDirection' });

const PartnerCreateSchema = z
  .object({
    sharedWithId: z.uuidv4().describe('User ID to share with'),
  })
  .meta({ id: 'PartnerCreateDto' });

const PartnerUpdateSchema = z
  .object({
    inTimeline: z.boolean().describe('Show partner assets in timeline'),
  })
  .meta({ id: 'PartnerUpdateDto' });

const PartnerSearchSchema = z
  .object({
    direction: PartnerDirectionSchema,
  })
  .meta({ id: 'PartnerSearchDto' });

const PartnerResponseSchema = UserResponseSchema.extend({
  inTimeline: z.boolean().optional().describe('Show in timeline'),
})
  .describe('Partner response')
  .meta({ id: 'PartnerResponseDto' });

export class PartnerCreateDto extends createZodDto(PartnerCreateSchema) {}
export class PartnerUpdateDto extends createZodDto(PartnerUpdateSchema) {}
export class PartnerSearchDto extends createZodDto(PartnerSearchSchema) {}
export class PartnerResponseDto extends createZodDto(PartnerResponseSchema) {}
