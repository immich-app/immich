#!/usr/bin/env node
import { OpenAPIObject } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ADDED_IN_PREFIX, DEPRECATED_IN_PREFIX, LIFECYCLE_EXTENSION, NEXT_RELEASE } from 'src/constants';
import { Version } from 'src/utils/version';

const outputPath = resolve(process.cwd(), '../open-api/immich-openapi-specs.json');
const spec = JSON.parse(readFileSync(outputPath).toString()) as OpenAPIObject;

type Items = {
  oldEndpoints: Endpoint[];
  newEndpoints: Endpoint[];
  oldProperties: Property[];
  newProperties: Property[];
};
type Endpoint = { url: string; method: string; endpoint: any };
type Property = { schema: string; property: string };

const metadata: Record<string, Items> = {};
const trackVersion = (version: string) => {
  if (!metadata[version]) {
    metadata[version] = {
      oldEndpoints: [],
      newEndpoints: [],
      oldProperties: [],
      newProperties: [],
    };
  }
  return metadata[version];
};

for (const [url, methods] of Object.entries(spec.paths)) {
  for (const [method, endpoint] of Object.entries(methods) as Array<[string, any]>) {
    const deprecatedAt = endpoint[LIFECYCLE_EXTENSION]?.deprecatedAt;
    if (deprecatedAt) {
      trackVersion(deprecatedAt).oldEndpoints.push({ url, method, endpoint });
    }

    const addedAt = endpoint[LIFECYCLE_EXTENSION]?.addedAt;
    if (addedAt) {
      trackVersion(addedAt).newEndpoints.push({ url, method, endpoint });
    }
  }
}

for (const [schemaName, schema] of Object.entries(spec.components?.schemas || {})) {
  for (const [propertyName, property] of Object.entries((schema as SchemaObject).properties || {})) {
    const propertySchema = property as SchemaObject;
    if (propertySchema.description?.startsWith(DEPRECATED_IN_PREFIX)) {
      const deprecatedAt = propertySchema.description.replace(DEPRECATED_IN_PREFIX, '').trim();
      trackVersion(deprecatedAt).oldProperties.push({ schema: schemaName, property: propertyName });
    }

    if (propertySchema.description?.startsWith(ADDED_IN_PREFIX)) {
      const addedAt = propertySchema.description.replace(ADDED_IN_PREFIX, '').trim();
      trackVersion(addedAt).newProperties.push({ schema: schemaName, property: propertyName });
    }
  }
}

const sortedVersions = Object.keys(metadata).sort((a, b) => {
  if (a === NEXT_RELEASE) {
    return -1;
  }

  if (b === NEXT_RELEASE) {
    return 1;
  }

  const versionA = Version.fromString(a);
  const versionB = Version.fromString(b);
  return versionB.compareTo(versionA);
});

for (const version of sortedVersions) {
  const { oldEndpoints, newEndpoints, oldProperties, newProperties } = metadata[version];
  console.log(`\nChanges in ${version}`);
  console.log('---------------------');
  for (const { url, method, endpoint } of oldEndpoints) {
    console.log(`- Deprecated ${method.toUpperCase()} ${url} (${endpoint.operationId})`);
  }
  for (const { url, method, endpoint } of newEndpoints) {
    console.log(`- Added      ${method.toUpperCase()} ${url} (${endpoint.operationId})`);
  }
  for (const { schema, property } of oldProperties) {
    console.log(`- Deprecated ${schema}.${property}`);
  }
  for (const { schema, property } of newProperties) {
    console.log(`- Added      ${schema}.${property}`);
  }
}
