import type { JSONSchema } from 'src/types/plugin-schema.types';
import {
  validateActionConfig,
  validateFilterConfig,
  validateTriggerConfig,
  ValidationError,
} from 'src/utils/plugin-schema.validator';

/**
 * Example tests demonstrating JSON Schema validation with ajv
 */

describe('Plugin Schema Validation', () => {
  describe('validateTriggerConfig', () => {
    it('should validate a valid trigger config', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          assetType: {
            type: 'string',
            enum: ['IMAGE', 'VIDEO', 'ALL'],
            default: 'ALL',
          },
        },
      };

      const config = {
        assetType: 'IMAGE',
      };

      expect(() => validateTriggerConfig(config, schema)).not.toThrow();
    });

    it('should reject invalid enum value', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          assetType: {
            type: 'string',
            enum: ['IMAGE', 'VIDEO', 'ALL'],
          },
        },
      };

      const config = {
        assetType: 'INVALID',
      };

      expect(() => validateTriggerConfig(config, schema)).toThrow(ValidationError);
    });

    it('should allow null config when schema is null', () => {
      expect(() => validateTriggerConfig(null, null)).not.toThrow();
      expect(() => validateTriggerConfig({}, null)).not.toThrow();
    });
  });

  describe('validateFilterConfig', () => {
    it('should validate complex filter config', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
          },
          matchType: {
            type: 'string',
            enum: ['contains', 'regex', 'exact'],
            default: 'contains',
          },
          caseSensitive: {
            type: 'boolean',
            default: false,
          },
        },
        required: ['pattern'],
      };

      const config = {
        pattern: '*.jpg',
        matchType: 'regex',
        caseSensitive: false,
      };

      expect(() => validateFilterConfig(config, schema)).not.toThrow();
    });

    it('should reject config missing required field', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
          },
        },
        required: ['pattern'],
      };

      const config = {
        matchType: 'regex',
      };

      expect(() => validateFilterConfig(config, schema)).toThrow(ValidationError);

      try {
        validateFilterConfig(config, schema);
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.message).toContain('pattern');
          expect(error.errors).toBeDefined();
        }
      }
    });

    it('should validate array properties', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          fileTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['IMAGE', 'VIDEO', 'RAW', 'LIVE_PHOTO'],
            },
          },
        },
        required: ['fileTypes'],
      };

      const config = {
        fileTypes: ['IMAGE', 'VIDEO'],
      };

      expect(() => validateFilterConfig(config, schema)).not.toThrow();
    });

    it('should reject invalid array item', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          fileTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['IMAGE', 'VIDEO', 'RAW', 'LIVE_PHOTO'],
            },
          },
        },
      };

      const config = {
        fileTypes: ['IMAGE', 'INVALID'],
      };

      expect(() => validateFilterConfig(config, schema)).toThrow(ValidationError);
    });
  });

  describe('validateActionConfig', () => {
    it('should validate nested object config', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          albumId: {
            type: 'string',
          },
          createIfNotExists: {
            type: 'boolean',
            default: false,
          },
          albumName: {
            type: 'string',
          },
        },
        required: ['albumId'],
      };

      const config = {
        albumId: '123-456-789',
        createIfNotExists: true,
        albumName: 'My Album',
      };

      expect(() => validateActionConfig(config, schema)).not.toThrow();
    });

    it('should validate boolean properties', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          favorite: {
            type: 'boolean',
            default: true,
          },
        },
      };

      const validConfig = {
        favorite: false,
      };

      expect(() => validateActionConfig(validConfig, schema)).not.toThrow();

      const invalidConfig = {
        favorite: 'true', // String instead of boolean
      };

      expect(() => validateActionConfig(invalidConfig, schema)).toThrow(ValidationError);
    });

    it('should allow empty config with no required fields', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          notify: {
            type: 'boolean',
            default: false,
          },
        },
      };

      const config = {};

      expect(() => validateActionConfig(config, schema)).not.toThrow();
    });
  });

  describe('Real-world examples', () => {
    it('should validate filename match filter', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Text or regex pattern to match against filename',
          },
          matchType: {
            type: 'string',
            enum: ['contains', 'regex', 'exact'],
            default: 'contains',
          },
          caseSensitive: {
            type: 'boolean',
            default: false,
          },
        },
        required: ['pattern'],
      };

      const config = {
        pattern: '^IMG_\\d{4}\\.jpg$',
        matchType: 'regex',
        caseSensitive: true,
      };

      expect(() => validateFilterConfig(config, schema)).not.toThrow();
    });

    it('should validate add to album action', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          albumId: {
            type: 'string',
          },
          createIfNotExists: {
            type: 'boolean',
            default: false,
          },
          albumName: {
            type: 'string',
          },
        },
        required: ['albumId'],
      };

      const config = {
        albumId: 'vacation-2024',
        createIfNotExists: true,
        albumName: 'Vacation 2024',
      };

      expect(() => validateActionConfig(config, schema)).not.toThrow();
    });
  });
});
