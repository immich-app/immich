import { createZodDto } from 'nestjs-zod';
import { ImmichHeader } from 'src/enum';
import { isoDatetimeToDate } from 'src/validation';
import { parseDictionary } from 'structured-headers';
import z from 'zod';

export enum Header {
  ContentLength = 'content-length',
  ContentType = 'content-type',
  InteropVersion = 'upload-draft-interop-version',
  ReprDigest = 'repr-digest',
  UploadComplete = 'upload-complete',
  UploadIncomplete = 'upload-incomplete',
  UploadLength = 'upload-length',
  UploadOffset = 'upload-offset',
}

const UploadAssetDataSchema = z.object({
  deviceAssetId: z.string().min(1),
  deviceId: z.string().min(1),
  fileCreatedAt: isoDatetimeToDate,
  fileModifiedAt: isoDatetimeToDate,
  filename: z.string().min(1),
  isFavorite: z.boolean().optional(),
  livePhotoVideoId: z.string().min(1).optional(),
  iCloudId: z.string().min(1).optional(),
});

export class UploadAssetDataDto extends createZodDto(UploadAssetDataSchema) {}

const structuredDictionary = z.string().transform((value, ctx) => {
  try {
    return parseDictionary(value);
  } catch {
    ctx.addIssue({ code: 'custom', message: 'must be a valid structured dictionary' });
    return z.NEVER;
  }
});

const assetData = structuredDictionary.transform((dict, ctx) => {
  const result = UploadAssetDataSchema.safeParse({
    deviceAssetId: dict.get('device-asset-id')?.[0],
    deviceId: dict.get('device-id')?.[0],
    filename: dict.get('filename')?.[0],
    fileCreatedAt: dict.get('file-created-at')?.[0],
    fileModifiedAt: dict.get('file-modified-at')?.[0],
    isFavorite: dict.get('is-favorite')?.[0],
    livePhotoVideoId: dict.get('live-photo-video-id')?.[0],
    iCloudId: dict.get('icloud-id')?.[0],
  });
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message });
    }
    return z.NEVER;
  }
  return result.data;
});

const checksum = structuredDictionary.transform((dict, ctx) => {
  const value = dict.get('sha')?.[0];
  if (value instanceof ArrayBuffer && value.byteLength === 20) {
    return Buffer.from(value);
  }
  ctx.addIssue({ code: 'custom', message: `Invalid ${Header.ReprDigest} header` });
  return z.NEVER;
});

const BaseUploadHeadersInputSchema = z.object({
  [Header.ContentLength]: z.coerce.number().int().min(0),
});

const BaseUploadHeadersSchema = BaseUploadHeadersInputSchema.transform((headers) => ({
  contentLength: headers[Header.ContentLength],
}));

export class BaseUploadHeadersDto extends createZodDto(BaseUploadHeadersSchema) {}

const StartUploadSchema = BaseUploadHeadersInputSchema.extend({
  [Header.InteropVersion]: z.coerce.number().int().min(3).optional(),
  [ImmichHeader.AssetData]: assetData,
  [Header.ReprDigest]: checksum,
  [Header.UploadLength]: z.coerce.number().int().min(1).optional(),
  [Header.UploadComplete]: z.string().optional(),
  [Header.UploadIncomplete]: z.string().optional(),
})
  .transform((headers, ctx) => {
    const complete = parseUploadComplete(headers, ctx);
    const length = headers[Header.UploadLength] ?? (complete === false ? undefined : headers[Header.ContentLength]);
    if (!length) {
      ctx.addIssue({ code: 'custom', path: [Header.UploadLength], message: `Missing ${Header.UploadLength} header` });
      return z.NEVER;
    }
    return {
      contentLength: headers[Header.ContentLength],
      version: headers[Header.InteropVersion],
      assetData: headers[ImmichHeader.AssetData],
      checksum: headers[Header.ReprDigest],
      uploadLength: length,
      uploadComplete: complete,
    };
  })
  .meta({ id: 'StartUploadDto' });

export class StartUploadDto extends createZodDto(StartUploadSchema) {}

const ResumeUploadSchema = BaseUploadHeadersInputSchema.extend({
  [Header.InteropVersion]: z.coerce.number().int().min(3),
  [Header.ContentType]: z.string().optional(),
  [Header.UploadLength]: z.coerce.number().int().min(1).optional(),
  [Header.UploadOffset]: z.coerce.number().int().min(0),
  [Header.UploadComplete]: z.string().optional(),
  [Header.UploadIncomplete]: z.string().optional(),
})
  .superRefine((headers, ctx) => {
    if (headers[Header.InteropVersion] >= 6 && headers[Header.ContentType] !== 'application/partial-upload') {
      ctx.addIssue({
        code: 'custom',
        path: [Header.ContentType],
        message: 'must be equal to application/partial-upload',
      });
    }
  })
  .transform((headers, ctx) => ({
    contentLength: headers[Header.ContentLength],
    version: headers[Header.InteropVersion],
    contentType: headers[Header.ContentType],
    uploadLength: headers[Header.UploadLength],
    uploadOffset: headers[Header.UploadOffset],
    uploadComplete: parseUploadComplete(headers, ctx, true),
  }))
  .meta({ id: 'ResumeUploadDto' });

export class ResumeUploadDto extends createZodDto(ResumeUploadSchema) {}

const GetUploadStatusSchema = z
  .object({ [Header.InteropVersion]: z.coerce.number().int().min(3) })
  .transform((headers) => ({ version: headers[Header.InteropVersion] }))
  .meta({ id: 'GetUploadStatusDto' });

export class GetUploadStatusDto extends createZodDto(GetUploadStatusSchema) {}

const UploadOkSchema = z.object({ id: z.string() }).meta({ id: 'UploadOkDto' });

export class UploadOkDto extends createZodDto(UploadOkSchema) {}

const STRUCTURED_TRUE = '?1';
const STRUCTURED_FALSE = '?0';

function parseStructuredBoolean(value: string | undefined, header: Header, ctx: z.RefinementCtx) {
  if (value === STRUCTURED_TRUE) {
    return true;
  }
  if (value === STRUCTURED_FALSE) {
    return false;
  }
  if (value !== undefined) {
    ctx.addIssue({ code: 'custom', path: [header], message: `${header} must be a structured boolean value` });
  }
}

type UploadCompleteHeaders = {
  [Header.UploadComplete]?: string;
  [Header.UploadIncomplete]?: string;
};

function parseUploadComplete(headers: UploadCompleteHeaders, ctx: z.RefinementCtx, required: true): boolean;
function parseUploadComplete(
  headers: UploadCompleteHeaders,
  ctx: z.RefinementCtx,
  required?: false,
): boolean | undefined;
function parseUploadComplete(
  headers: UploadCompleteHeaders,
  ctx: z.RefinementCtx,
  required = false,
): boolean | undefined {
  const complete = parseStructuredBoolean(headers[Header.UploadComplete], Header.UploadComplete, ctx);
  if (complete !== undefined) {
    return complete;
  }

  const incomplete = parseStructuredBoolean(headers[Header.UploadIncomplete], Header.UploadIncomplete, ctx);
  if (incomplete !== undefined) {
    return !incomplete;
  }
  if (required && headers[Header.UploadComplete] === undefined && headers[Header.UploadIncomplete] === undefined) {
    ctx.addIssue({ code: 'custom', path: [Header.UploadComplete], message: 'is required' });
    return z.NEVER;
  }
}
