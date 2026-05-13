export type ComponentType = 'select' | 'multiselect' | 'text' | 'switch' | 'checkbox';

export interface ComponentConfig {
  type: ComponentType;
  label?: string;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  placeholder?: string;
  subType?: string;
  title?: string;
}

interface JSONSchemaProperty {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  subType?: string;
  title?: string;
}

interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

export const getComponentDefaultValue = (component: ComponentConfig): unknown => {
  if (component.defaultValue !== undefined) {
    return component.defaultValue;
  }

  if (component.type === 'multiselect' || (component.type === 'text' && component.subType === 'people-picker')) {
    return [];
  }

  if (component.type === 'switch') {
    return false;
  }

  return '';
};

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
  const { type, title, enum: enumValues, description, default: defaultValue, items } = property;

  const config: ComponentConfig = {
    type: 'text',
    label: formatLabel(propertyName),
    description,
    defaultValue,
    title,
  };

  if (enumValues && enumValues.length > 0) {
    config.type = 'select';
    config.options = enumValues.map((value: unknown) => ({
      label: formatLabel(String(value)),
      value: value as string | number | boolean,
    }));
    return config;
  }

  if (type === 'array' && items?.enum && items.enum.length > 0) {
    config.type = 'multiselect';
    config.subType = items.subType;
    config.options = items.enum.map((value: unknown) => ({
      label: formatLabel(String(value)),
      value: value as string | number | boolean,
    }));

    return config;
  }

  if (type === 'boolean') {
    config.type = 'switch';
    return config;
  }

  if (type === 'string') {
    config.type = 'text';
    config.subType = property.subType;
    config.placeholder = description;
    return config;
  }

  if (type === 'array') {
    config.type = 'multiselect';
    config.subType = property.subType;
    return config;
  }

  return config;
}

export function formatLabel(propertyName: string): string {
  return propertyName
    .replaceAll(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
