/**
 * JSON Schema types for plugin configuration schemas
 * Based on JSON Schema Draft 7
 */

export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export interface JSONSchemaProperty {
  type?: JSONSchemaType | JSONSchemaType[];
  description?: string;
  default?: any;
  enum?: any[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  additionalProperties?: boolean | JSONSchemaProperty;
}

export interface JSONSchema {
  type: 'object';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
}

/**
 * Plugin manifest schema structure
 */
export interface PluginManifestTrigger {
  name: string;
  displayName: string;
  description: string;
  context: 'asset' | 'album' | 'user' | 'person';
  schema: JSONSchema;
  functionName: string;
}

export interface PluginManifestFilter {
  name: string;
  displayName: string;
  description: string;
  supportedContexts: ('asset' | 'album' | 'user' | 'person')[];
  schema: JSONSchema;
  functionName: string;
}

export interface PluginManifestAction {
  name: string;
  displayName: string;
  description: string;
  supportedContexts: ('asset' | 'album' | 'user' | 'person')[];
  schema: JSONSchema;
  functionName: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  wasm: {
    url: string;
    hash: string;
    allowedHosts: string[];
  };
  triggers: PluginManifestTrigger[];
  filters: PluginManifestFilter[];
  actions: PluginManifestAction[];
}

/**
 * Example configuration values that conform to schemas
 * These are the actual runtime config values stored in workflow_filter, workflow_action, etc.
 */
export type ConfigValue = string | number | boolean | null | ConfigValue[] | { [key: string]: ConfigValue };

export interface TriggerConfig {
  [key: string]: ConfigValue;
}

export interface FilterConfig {
  [key: string]: ConfigValue;
}

export interface ActionConfig {
  [key: string]: ConfigValue;
}
