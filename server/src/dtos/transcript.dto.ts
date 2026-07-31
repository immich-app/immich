import { createZodDto } from 'nestjs-zod';
import { TranscriptionStatus } from 'src/enum';
import z from 'zod';

const TranscriptionStatusSchema = z
  .enum(TranscriptionStatus)
  .describe('Whether transcription has never run, is still running, or has finished')
  .meta({ id: 'TranscriptionStatus' });

const TranscriptSegmentResponseSchema = z
  .object({
    id: z.uuidv4(),
    startTime: z
      .number()
      .meta({ format: 'double' })
      .describe('Start of the segment, in seconds from the start of the asset'),
    endTime: z
      .number()
      .meta({ format: 'double' })
      .describe('End of the segment, in seconds from the start of the asset'),
    text: z.string().describe("The model's own transcription of the segment, unaffected by any correction"),
    correctedText: z
      .string()
      .nullable()
      .describe(
        'Human-corrected text for the segment, or null if uncorrected. Preferred over `text` for display and search wherever it is set.',
      ),
    language: z
      .string()
      .nullable()
      .describe('Resolved language of the segment as an ISO 639-1 code, or null for segments transcribed before'),
  })
  .meta({ id: 'TranscriptSegmentResponseDto' });

const UpdateTranscriptSegmentSchema = z
  .object({
    correctedText: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .describe('Corrected text for the segment, or null to revert to the transcribed text'),
  })
  .meta({ id: 'UpdateTranscriptSegmentDto' });

const TranscriptSegmentParamsSchema = z
  .object({
    id: z.uuidv4().describe('Asset ID'),
    segmentId: z.uuidv4().describe('Transcript segment ID'),
  })
  .meta({ id: 'TranscriptSegmentParams' });

/**
 * Deliberately carries the job state alongside the segments, because a read is not gated on
 * completion: a transcript still filling in is worth showing, and a client can only present it
 * honestly — and know whether to ask again — if it can tell "never started" from "still running".
 */
const AssetTranscriptResponseSchema = z
  .object({
    status: TranscriptionStatusSchema,
    progressMs: z
      .number()
      .int()
      .describe('How far into the audio the transcript is committed, in milliseconds. Zero when it has not started'),
    segments: z.array(TranscriptSegmentResponseSchema).describe('Segments transcribed so far, ordered by start time'),
  })
  .meta({ id: 'AssetTranscriptResponseDto' });

export class AssetTranscriptResponseDto extends createZodDto(AssetTranscriptResponseSchema) {}
export class TranscriptSegmentResponseDto extends createZodDto(TranscriptSegmentResponseSchema) {}
export class UpdateTranscriptSegmentDto extends createZodDto(UpdateTranscriptSegmentSchema) {}
export class TranscriptSegmentParams extends createZodDto(TranscriptSegmentParamsSchema) {}
