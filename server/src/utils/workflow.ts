import { WorkflowTrigger } from '@immich/plugin-sdk';
import { WorkflowType } from 'src/enum';
import { PluginMethodSearchResponse } from 'src/repositories/plugin.repository';

export const triggerMap: Record<WorkflowTrigger, WorkflowType[]> = {
  [WorkflowTrigger.AssetCreate]: [WorkflowType.AssetV1],
  // [WorkflowTrigger.PersonRecognized]: [WorkflowType.AssetPersonV1],
  [WorkflowTrigger.AssetMetadataExtraction]: [WorkflowType.AssetV1],
  [WorkflowTrigger.AssetTagged]: [WorkflowType.AssetV1],
};

export const getWorkflowTriggers = () =>
  Object.entries(triggerMap).map(([trigger, types]) => ({ trigger: trigger as WorkflowTrigger, types }));

/** some types extend other types and have implied compatibility */
const inferredMap: Record<WorkflowType, WorkflowType[]> = {
  [WorkflowType.AssetV1]: [],
  // [WorkflowType.AssetPersonV1]: [WorkflowType.AssetV1],
};

const withImpliedItems = (type: WorkflowType): WorkflowType[] => {
  const childTypes = inferredMap[type];
  const results = [type];
  for (const child of childTypes) {
    results.push(...withImpliedItems(child));
  }

  return results;
};

export const isMethodCompatible = (pluginMethod: { types: WorkflowType[] }, trigger: WorkflowTrigger) => {
  const validTypes = triggerMap[trigger];
  const pluginCompatibility = pluginMethod.types.map((type) => withImpliedItems(type));
  for (const requested of validTypes) {
    for (const pluginCompatibilityGroup of pluginCompatibility) {
      if (pluginCompatibilityGroup.includes(requested)) {
        return true;
      }
    }
  }

  return false;
};

export const resolveMethod = (methods: PluginMethodSearchResponse[], method: string) => {
  const result = parseMethodString(method);
  if (!result) {
    return;
  }

  const { pluginName, methodName } = result;

  return methods.find((method) => method.pluginName === pluginName && method.name === methodName);
};

export const asPluginKey = (method: { pluginName: string; name: string }) => {
  return `${method.pluginName}#${method.name}`;
};

const METHOD_REGEX = /^(?<name>[^@#\s]+)(?:@(?<version>[^#\s]*))?#(?<method>[^@#\s]+)$/;
export const parseMethodString = (method: string) => {
  const matches = METHOD_REGEX.exec(method);
  if (!matches) {
    return;
  }

  const pluginName = matches.groups?.name;
  const version = matches.groups?.version;
  const methodName = matches.groups?.method;
  return { pluginName, version, methodName };
};
