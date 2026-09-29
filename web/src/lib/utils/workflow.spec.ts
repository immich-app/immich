import { getWorkflowDefaultConfig } from '$lib/utils/workflow';

describe(getWorkflowDefaultConfig.name, () => {
  describe('required properties', () => {
    it('should use a default value', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            test: {
              type: 'boolean',
              default: true,
            },
          },
          required: ['test'],
        }),
      ).toEqual({ test: true });
    });

    it('should default to an empty array', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            test: {
              type: 'string',
              array: true,
            },
          },
          required: ['test'],
        }),
      ).toEqual({ test: [] });
    });

    it('should default to false', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            test: {
              type: 'boolean',
            },
          },
          required: ['test'],
        }),
      ).toEqual({ test: false });
    });

    it('should default to 0 (integer)', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            test: {
              type: 'integer',
            },
          },
          required: ['test'],
        }),
      ).toEqual({ test: 0 });
    });

    it('should default to 0 (number)', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            test: {
              type: 'number',
            },
          },
          required: ['test'],
        }),
      ).toEqual({ test: 0 });
    });

    it('should default to an empty string', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            test: {
              type: 'string',
            },
          },
          required: ['test'],
        }),
      ).toEqual({ test: '' });
    });

    it('should default recursively', () => {
      expect(
        getWorkflowDefaultConfig({
          type: 'object',
          properties: {
            parent: {
              type: 'object',
              properties: {
                test: {
                  type: 'string',
                  array: true,
                },
              },
              required: ['test'],
            },
          },
          required: ['parent'],
        }),
      ).toEqual({ parent: { test: [] } });
    });
  });
});
