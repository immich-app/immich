import type { WorkflowType } from '@immich/sdk';
import { hostFunctions } from 'src/host-functions.js';
import type {
  ConfigValue,
  WorkflowEventPayload,
  WorkflowResponse,
  WorkflowStepConfig,
} from 'src/types.js';

export const wrapper = <
  T extends WorkflowType,
  TConfig extends ConfigValue = ConfigValue,
>(
  fn: (
    payload: WorkflowEventPayload<T, TConfig> & {
      functions: ReturnType<typeof hostFunctions>;
    },
  ) => WorkflowResponse<T> | undefined,
) => {
  const input = Host.inputString();

  try {
    const payload = JSON.parse(input) as WorkflowEventPayload<T, TConfig>;
    const event = {
      ...payload,
      functions: hostFunctions(payload.workflow.authToken),
    };

    const eventConfigBefore = JSON.stringify(event.config);

    console.debug(
      `Inputs: trigger=${event.trigger}, event=${event.type}, config=${eventConfigBefore}`,
    );

    const response = fn(event) ?? {};

    // if config changed, notify host
    const eventConfigAfter = JSON.stringify(event.config);
    if (!response.config && eventConfigBefore !== eventConfigAfter) {
      response.config = event.config as WorkflowStepConfig;
    }

    console.debug(
      `Outputs: workflow=${JSON.stringify(response.workflow)}, changes=${JSON.stringify(response.changes)}, data=${JSON.stringify(response.data)}, config=${JSON.stringify(response.config)}`,
    );

    const output = JSON.stringify(response);
    Host.outputString(output);
  } catch (error: Error | any) {
    console.error(`Unhandled plugin exception: ${error.message || error}`);
    throw error;
  }
};
