export type ComponentType = 'select' | 'multiselect' | 'text' | 'textarea' | 'number' | 'switch' | 'checkbox';

export interface ComponentConfig {
  type: ComponentType;
  label?: string;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

interface JSONSchemaProperty {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
}

interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export const getComponentFromSchema = (schema: object | null): Record<string, ComponentConfig> | null => {
  if (!schema || !isJSONSchema(schema) || !schema.properties) {
    return null;
  }

  const components: Record<string, ComponentConfig> = {};
  const requiredFields = schema.required || [];

  for (const [propertyName, property] of Object.entries(schema.properties)) {
    const config = getComponentForProperty(property, propertyName);
    if (config) {
      config.required = requiredFields.includes(propertyName);
      components[propertyName] = config;
    }
  }

  return Object.keys(components).length > 0 ? components : null;
};

function isJSONSchema(obj: object): obj is JSONSchema {
  return 'properties' in obj || 'type' in obj;
}

function getComponentForProperty(property: JSONSchemaProperty, propertyName: string): ComponentConfig | null {
  const { type, enum: enumValues, description, default: defaultValue, items } = property;

  const config: ComponentConfig = {
    type: 'text',
    label: formatLabel(propertyName),
    description,
    defaultValue,
  };

  // Handle enum (dropdown)
  if (enumValues && enumValues.length > 0) {
    config.type = 'select';
    config.options = enumValues.map((value: unknown) => ({
      label: String(value),
      value: value as string | number | boolean,
    }));
    return config;
  }

  // Handle array with enum items (multi-select)
  if (type === 'array' && items?.enum && items.enum.length > 0) {
    config.type = 'multiselect';
    config.options = items.enum.map((value: unknown) => ({
      label: String(value),
      value: value as string | number | boolean,
    }));
    return config;
  }

  // Handle boolean (switch/checkbox)
  if (type === 'boolean') {
    config.type = 'switch';
    return config;
  }

  // Handle string
  if (type === 'string') {
    // Check if it's a long text field
    if (property.maxLength && property.maxLength > 200) {
      config.type = 'textarea';
    } else {
      config.type = 'text';
    }
    config.placeholder = description;
    return config;
  }

  // Handle number/integer
  if (type === 'number' || type === 'integer') {
    config.type = 'number';
    config.min = property.minimum;
    config.max = property.maximum;
    return config;
  }

  // Handle array (generic)
  if (type === 'array') {
    config.type = 'multiselect';
    return config;
  }

  return config;
}

function formatLabel(propertyName: string): string {
  // Convert camelCase or snake_case to Title Case
  return propertyName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
