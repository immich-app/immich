import { FileValidator, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { createZodDto } from 'nestjs-zod';
import sanitize from 'sanitize-filename';
import { isIP, isIPRange } from 'validator';
import z from 'zod';

export type IsIPRangeOptions = { requireCIDR?: boolean };

function isIPOrRange(value: string, options?: IsIPRangeOptions): boolean {
  const { requireCIDR = true } = options ?? {};
  if (isIPRange(value)) {
    return true;
  }
  return !requireCIDR && isIP(value);
}

/**
 * Zod schema that validates an array of strings as IP addresses or IP/CIDR ranges.
 * When requireCIDR is true (default), plain IPs are rejected; only CIDR ranges are allowed.
 *
 * @example
 * z.string().optional().transform(...).pipe(IsIPRange())
 * @example
 * z.string().optional().transform(...).pipe(IsIPRange({ requireCIDR: false }))
 */
export function IsIPRange(options?: IsIPRangeOptions) {
  return z
    .array(z.string())
    .refine((arr) => arr.every((item) => isIPOrRange(item, options)), 'Must be an ip address or ip address range');
}

/**
 * Like z.object().partial(), but rejects objects where every field is undefined.
 * Use for update/patch DTOs where at least one field must be provided.
 *
 * @example
 * nonEmptyPartial({ name: z.string(), bio: z.string() }).meta({ id: 'UpdateDto' });
 */
export function nonEmptyPartial<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .partial()
    .refine((data) => Object.values(data as Record<string, unknown>).some((value) => value !== undefined), {
      message: `At least one of the following fields is required: ${Object.keys(shape).join(', ')}`,
    });
}

/**
 * Zod schema that validates sibling-exclusion for object schemas.
 * Validation passes when the target property is missing, or when none of the sibling properties are present.
 * Use with .pipe() like IsIPRange.
 *
 * @example
 * const Schema = z.object({ a: z.string().optional(), b: z.string().optional() });
 * Schema.pipe(IsNotSiblingOf(Schema, 'a', ['b']));
 */
export function IsNotSiblingOf<
  TSchema extends z.ZodObject<z.ZodRawShape>,
  TKey extends z.infer<ReturnType<TSchema['keyof']>> & keyof z.infer<TSchema>,
>(_schema: TSchema, property: TKey, siblings: TKey[]) {
  type T = z.infer<TSchema>;
  const message = `${property} cannot exist alongside ${siblings.join(' or ')}`;
  return z.custom<T>().refine(
    (data) => {
      if (data[property] === undefined) {
        return true;
      }
      return siblings.every((sibling) => data[sibling] === undefined);
    },
    { message },
  );
}

@Injectable()
export class FileNotEmptyValidator extends FileValidator {
  constructor(private requiredFields: string[]) {
    super({});
    this.requiredFields = requiredFields;
  }

  isValid(files?: any): boolean {
    if (!files) {
      return false;
    }

    return this.requiredFields.every((field) => files[field]);
  }

  buildErrorMessage(): string {
    return `Field(s) ${this.requiredFields.join(', ')} should not be empty`;
  }
}

const UUIDParamSchema = z.object({
  id: z.uuidv4(),
});

export class UUIDParamDto extends createZodDto(UUIDParamSchema) {}

const UUIDv7ParamSchema = z.object({
  id: z.uuidv7(),
});

export class UUIDv7ParamDto extends createZodDto(UUIDv7ParamSchema) {}

const UUIDAssetIDParamSchema = z.object({
  id: z.uuidv4(),
  assetId: z.uuidv4(),
});

export class UUIDAssetIDParamDto extends createZodDto(UUIDAssetIDParamSchema) {}

const FilenameParamSchema = z.object({
  filename: z.string().regex(/^[a-zA-Z0-9_\-.]+$/, {
    error: 'Filename contains invalid characters',
  }),
});

export class FilenameParamDto extends createZodDto(FilenameParamSchema) {}

/**
 * Unified email validation
 * Converts email strings to lowercase and validates against HTML5 email regex
 * @docs https://zod.dev/api?id=email
 */
export const toEmail = z
  .email({
    pattern: z.regexes.html5Email,
    error: (iss) => `Invalid input: expected email, received ${typeof iss.input}`,
  })
  .transform((val) => val.toLowerCase());

/**
 * Parse ISO 8601 datetime strings to Date objects
 * @docs https://zod.dev/api?id=codec
 */
export const isoDatetimeToDate = z
  .codec(
    z.iso.datetime({
      error: (iss) => `Invalid input: expected ISO 8601 datetime string, received ${typeof iss.input}`,
      offset: true,
    }),
    z.date(),
    {
      decode: (isoString) => new Date(isoString),
      encode: (date) => date.toISOString(),
    },
  )
  .meta({ example: '2024-01-01T00:00:00.000Z' });

/**
 * Parse ISO date strings to Date objects
 * @docs https://zod.dev/api?id=codec
 */
export const isoDateToDate = z
  .codec(
    z.iso.date({
      error: (iss) => `Invalid input: expected ISO date string (YYYY-MM-DD), received ${typeof iss.input}`,
    }),
    z.date(),
    {
      decode: (isoString) => new Date(isoString),
      encode: (date) => DateTime.fromJSDate(date).toFormat('yyyy-MM-dd'),
    },
  )
  .meta({ example: '2024-01-01' });

/**
 * Latitude in range [-90, 90]. Reuse for body or query params.
 *
 * @example
 * // Regular (body): optional coordinates
 * latitudeSchema.optional().describe('Latitude coordinate')
 *
 * @example
 * // Pipe (query): coerce string to number then validate range
 * z.coerce.number().pipe(latitudeSchema).describe('Latitude (-90 to 90)')
 */
export const latitudeSchema = z.number().min(-90).max(90);

/**
 * Longitude in range [-180, 180]. Reuse for body or query params.
 *
 * @example
 * // Regular (body): optional coordinates
 * longitudeSchema.optional().describe('Longitude coordinate')
 *
 * @example
 * // Pipe (query): coerce string to number then validate range
 * z.coerce.number().pipe(longitudeSchema).describe('Longitude (-180 to 180)')
 */
export const longitudeSchema = z.number().min(-180).max(180);

/**
 * Parse string to boolean
 * This should be used for boolean query parameters and path parameters, but not for boolean request body parameters, as the first are always string.
 * We don't use z.coerce.boolean() as any truthy value is considered true
 * z.stringbool() is a more robust way to parse strings to booleans as it lets you specify the truthy and falsy values and the case sensitivity.
 * @docs https://zod.dev/api?id=coercion
 * @docs https://zod.dev/api?id=stringbool
 */
export const stringToBool = z
  .stringbool({ truthy: ['true'], falsy: ['false'], case: 'sensitive' })
  .meta({ type: 'boolean' });

/**
 * Parse JSON strings from multipart/form-data
 */
export const JsonParsed = z.transform((val, ctx) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      ctx.issues.push({
        code: 'custom',
        message: `Invalid input: expected JSON string, received ${typeof val}`,
        input: val,
      });
      return z.NEVER;
    }
  }
  return val;
});

/**
 * Hex color validation and normalization.
 * Accepts formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA (with or without # prefix).
 * Normalizes output to always include the # prefix.
 *
 * @example
 * hexColor.optional()
 */
const hexColorRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
export const hexColor = z
  .string()
  .regex(hexColorRegex)
  .transform((val) => (val.startsWith('#') ? val : `#${val}`));

export const sanitizeFilename = z.string().transform((val) => sanitize(val.replaceAll('.', '')));
