import Ajv from 'ajv';
import type { ActionConfig, FilterConfig, JSONSchema, TriggerConfig } from 'src/types/plugin-schema.types';

const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: any[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a trigger configuration against its JSON schema
 * @throws {ValidationError} If validation fails
 */
export function validateTriggerConfig(config: unknown, schema: JSONSchema | null): config is TriggerConfig {
  if (!schema) {
    // If no schema, just check that config is an object or null
    if (config !== null && typeof config !== 'object') {
      throw new ValidationError('Invalid trigger config: must be an object or null');
    }
    return true;
  }

  const validate = ajv.compile(schema);
  const isValid = validate(config);

  if (!isValid) {
    throw new ValidationError(
      `Invalid trigger config: ${ajv.errorsText(validate.errors)}`,
      validate.errors ?? undefined,
    );
  }

  return true;
}

/**
 * Validates a filter configuration against its JSON schema
 * @throws {ValidationError} If validation fails
 */
export function validateFilterConfig(config: unknown, schema: JSONSchema | null): config is FilterConfig {
  if (!schema) {
    // If no schema, just check that config is an object or null
    if (config !== null && typeof config !== 'object') {
      throw new ValidationError('Invalid filter config: must be an object or null');
    }
    return true;
  }

  const validate = ajv.compile(schema);
  const isValid = validate(config);

  if (!isValid) {
    throw new ValidationError(
      `Invalid filter config: ${ajv.errorsText(validate.errors)}`,
      validate.errors ?? undefined,
    );
  }

  return true;
}

/**
 * Validates an action configuration against its JSON schema
 * @throws {ValidationError} If validation fails
 */
export function validateActionConfig(config: unknown, schema: JSONSchema | null): config is ActionConfig {
  if (!schema) {
    // If no schema, just check that config is an object or null
    if (config !== null && typeof config !== 'object') {
      throw new ValidationError('Invalid action config: must be an object or null');
    }
    return true;
  }

  const validate = ajv.compile(schema);
  const isValid = validate(config);

  if (!isValid) {
    throw new ValidationError(
      `Invalid action config: ${ajv.errorsText(validate.errors)}`,
      validate.errors ?? undefined,
    );
  }

  return true;
}
