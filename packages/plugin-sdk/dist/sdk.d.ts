import type { WorkflowType } from '@immich/sdk';
import { hostFunctions } from './host-functions.js';
import type { ConfigValue, WorkflowEventPayload, WorkflowResponse } from './types.js';
export declare const wrapper: <T extends WorkflowType = WorkflowType, TConfig extends ConfigValue = ConfigValue>(fn: (payload: WorkflowEventPayload<T, TConfig> & {
    functions: ReturnType<typeof hostFunctions>;
}) => WorkflowResponse<T> | undefined) => void;
